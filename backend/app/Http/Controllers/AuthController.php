<?php

namespace App\Http\Controllers;

use App\Models\Auth\OtpCode;
use App\Models\User;
use Illuminate\Http\Request;
use App\Services\Sms\SmsService;
use Illuminate\Support\Facades\{Cache, DB, Hash, Validator, Auth, Log};
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Http\Resources\AuthUserResource;

class AuthController extends Controller
{

    protected function logLogin(User $user, string $method, Request $r): void
    {
        DB::table('login_logs')->insert([
            'user_id'      => $user->id,
            'ip_address'   => $r->ip(),
            'user_agent'   => substr((string) $r->userAgent(), 0, 1000),
            'login_method' => $method, // 'otp' | 'password'
            'created_at'   => now(),
        ]);
    }

    /** POST /auth/register-start  : phone -> OTP */
    public function registerStart(Request $r, SmsService $sms)
    {
        $r->validate(['phone' => 'required|string|max:20']);
        // Issue OTP for a phone without creating a user yet. This avoids creating
        // actual user rows until register-complete.
        $phone = $r->phone;

        // Rate limit درخواست OTP (per phone)
        $key    = "otp:req:phone:{$phone}";
        $window = (int) config('otp.window', 120);
        $limit  = (int) config('otp.request_limit', 5);
        $count  = (int) Cache::get($key, 0);
        if ($count >= $limit) {
            return response()->json([
                'code' => 'TOO_MANY_REQUESTS',
                'message' => 'Too many requests, try later',
                'data' => null,
            ], 429);
        }
        Cache::put($key, $count + 1, $window);

        // تولید OTP
        $len  = (int) config('otp.length', 5);
        $max  = (10 ** $len) - 1;
        $code = str_pad((string) random_int(0, $max), $len, '0', STR_PAD_LEFT);
        $ttl  = (int) config('otp.ttl', 120);

        // Attach OTP to phone; user_id will be null until registration completes
        $existingUser = User::where('phone', $phone)->first();

        // If otp_codes.phone column exists, persist to DB with phone
        try {
            if (Schema::hasColumn('otp_codes', 'phone')) {
                OtpCode::create([
                    'user_id'    => $existingUser?->id ?? null,
                    'phone'      => $phone,
                    'code'       => $code,
                    'expires_at' => now()->addSeconds($ttl),
                    'is_used'    => false,
                ]);

                // Log attempt only if user exists
                if ($existingUser) {
                    $this->logLogin($existingUser, 'otp', $r);
                }
            } else {
                // Migration not applied: store the OTP in cache by phone as fallback
                Cache::put("otp:cache:phone:{$phone}", [
                    'code' => $code,
                    'created_at' => now()->toDateTimeString(),
                    'ttl' => $ttl,
                ], $ttl);
            }
        } catch (\Throwable $e) {
            // Log and fallback to cache so the sent OTP is still verifiable even when
            // DB insert fails due to schema mismatch or other transient DB issues.
            try {
                Log::error('OTP persistence failed: '.$e->getMessage());
            } catch (\Throwable $_) {}

            // store to cache as a fallback so verification can succeed
            try {
                Cache::put("otp:cache:phone:{$phone}", [
                    'code' => $code,
                    'created_at' => now()->toDateTimeString(),
                    'ttl' => $ttl,
                ], $ttl);
            } catch (\Throwable $_) {}
        }

        // ارسال پیامک
        $sms->send($phone, "کد ورود شما: {$code} (اعتبار: {$ttl} ثانیه)");

        return response()->json([
            'code'    => 'OK',
            'message' => 'OTP sent',
            'data'    => ['ttl' => $ttl],
        ]);
    }

    /** POST /auth/register-complete : phone + otp + profile fields => user + token */
    public function registerComplete(Request $r)
    {
        // Allow frontend to send either `phone` or a generic `identifier`.
        // If `identifier` looks like a phone and `phone` is missing, map it.
        if (!$r->filled('phone') && $r->filled('identifier')) {
            $id = (string) $r->input('identifier');
            if (preg_match('/^\+?\d{6,20}$/', $id)) {
                $r->merge(['phone' => $id]);
            }
        }

        $v = Validator::make($r->all(), [
            'phone'       => ['required','string','max:20'],
            'otp'         => ['required','string'],
            // فیلدهای پروفایل (دلخواه ولی پیشنهاد می‌شود الزامی‌شان کنی)
            'first_name'  => ['nullable','string','max:100'],
            'last_name'   => ['nullable','string','max:100'],
            'email'       => ['nullable','email','max:255','unique:users,email'],
            'city'        => ['nullable','string','max:100'],
            'province'    => ['nullable','string','max:100'],
            'school_name' => ['nullable','string','max:150'],
            'grade_id'    => ['nullable','integer','exists:grades,id'],
            // اگر خواستی ثبت‌نام با رمز هم داشته باشی:
            'password'    => ['nullable','string','min:6'],
        ]);
        $v->validate();

        // find OTP by phone or (if a user exists) by user_id as well
    $phone = $r->phone;
        $maybeUser = User::where('phone', $phone)->first();

        if (Schema::hasColumn('otp_codes', 'phone')) {
            $otp = OtpCode::where('code', $r->otp)
                ->where('is_used', false)
                ->where(function ($q) use ($phone, $maybeUser) {
                    $q->where('phone', $phone);
                    if ($maybeUser) {
                        $q->orWhere('user_id', $maybeUser->id);
                    }
                })
                ->orderByDesc('id')
                ->first();
        } else {
            // fallback: check cache
            $cached = Cache::get("otp:cache:phone:{$phone}");
            $otp = null;
            if ($cached && isset($cached['code']) && $cached['code'] === $r->otp) {
                // created_at may be stored as string; parse safely
                try {
                    $created = $cached['created_at'] instanceof \DateTime ? \Carbon\Carbon::instance($cached['created_at']) : \Carbon\Carbon::parse($cached['created_at']);
                } catch (\Throwable $_) { $created = now(); }
                $expires = $created->addSeconds($cached['ttl'] ?? 120);
                if (now()->lt($expires)) {
                    // create a dummy object with required fields
                    $otp = (object) [
                        'id' => null,
                        'user_id' => $maybeUser?->id ?? null,
                        'code' => $cached['code'],
                        'expires_at' => $expires,
                        'is_used' => false,
                        'update' => function ($a) {},
                    ];
                }
            }
        }

        if (! $otp) {
            return response()->json([
                'code' => 'INVALID_OTP',
                'message' => 'Invalid code',
                'data' => null,
            ], 422);
        }
        if (Carbon::parse($otp->expires_at)->isPast()) {
            return response()->json([
                'code' => 'OTP_EXPIRED',
                'message' => 'Code expired',
                'data' => null,
            ], 422);
        }

        // consume OTP
        // mark used: if DB persisted, update; if cached, remove
        if (is_object($otp) && method_exists($otp, 'update')) {
            try { $otp->update(['is_used' => true]); } catch (\Throwable $e) {}
        } else {
            Cache::forget("otp:cache:phone:{$phone}");
        }

        // create user now if missing, or update existing user
        $user = $maybeUser;
        if (! $user) {
            $createData = [
                'phone' => $phone,
                'first_name' => $r->first_name ?? 'کاربر',
                'last_name'  => $r->last_name  ?? 'جدید',
                'name'       => trim(($r->first_name ?? 'کاربر').' '.($r->last_name ?? 'جدید')),
            ];
            if (Schema::hasColumn('users', 'is_temporary')) {
                // we are finalizing registration, so not temporary
                $createData['is_temporary'] = false;
            }
            $user = User::create($createData);
        }

        // تکمیل/به‌روزرسانی پروفایل
        $user->fill([
            'first_name'  => $r->first_name ?? $user->first_name,
            'last_name'   => $r->last_name  ?? $user->last_name,
            'name'        => trim(($r->first_name ?? $user->first_name).' '.($r->last_name ?? $user->last_name)) ?: $user->name,
            'email'       => $r->email      ?? $user->email,
            'city'        => $r->city       ?? $user->city,
            'province'    => $r->province   ?? $user->province,
            'school_name' => $r->school_name?? $user->school_name,
            'grade_id'    => $r->grade_id   ?? $user->grade_id,
        ]);

        if ($r->filled('password')) {
            $user->password = Hash::make($r->password);
        }

        $user->save();

        // صدور توکن
        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;

        // پاک کردن شمارنده‌های otp
        Cache::forget("otp:req:{$user->id}");
        Cache::forget("otp:verify:{$user->id}");

        $user->load('grade');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Registration completed',
            'data'    => [
                'token' => $token,
                'user'  => new AuthUserResource($user),
            ],
        ]);
    }
    public function loginStart(Request $r, SmsService $sms)
    {
        $r->validate(['phone' => 'required|string|max:20']);

        $user = User::where('phone', $r->phone)->first();
        if (! $user) {
            return response()->json([
                'code' => 'USER_NOT_FOUND',
                'message' => 'This phone is not registered. Please sign up.',
                'data' => null,
            ], 404);
        }
            // Prevent inactive/suspended users from requesting login
            if (! $user->is_active || $user->suspended_at !== null) {
                return response()->json([
                    'code' => 'USER_INACTIVE',
                    'message' => 'حساب شما فعال نیست و امکان ورود وجود ندارد.',
                    'data' => null,
                ], 403);
            }

        // Rate limit OTP requests per existing user
        $key    = "otp:req:{$user->id}";
        $window = (int) config('otp.window', 120);
        $limit  = (int) config('otp.request_limit', 5);
        $count  = (int) Cache::get($key, 0);
        if ($count >= $limit) {
            return response()->json([
                'code' => 'TOO_MANY_REQUESTS',
                'message' => 'Too many requests, try later',
                'data' => null,
            ], 429);
        }
        Cache::put($key, $count + 1, $window);

        // Generate OTP
        $len  = (int) config('otp.length', 5);
        $max  = (10 ** $len) - 1;
        $code = str_pad((string) random_int(0, $max), $len, '0', STR_PAD_LEFT);
        $ttl  = (int) config('otp.ttl', 120);

        // Persist OTP to DB when possible; fall back to cache if DB schema/insert fails
        try {
            if (Schema::hasColumn('otp_codes', 'phone')) {
                // table has phone column but we don't need to write it here
                OtpCode::create([
                    'user_id'    => $user->id,
                    'code'       => $code,
                    'expires_at' => now()->addSeconds($ttl),
                    'is_used'    => false,
                ]);
            } else {
                // older schema: write to DB without phone
                OtpCode::create([
                    'user_id'    => $user->id,
                    'code'       => $code,
                    'expires_at' => now()->addSeconds($ttl),
                    'is_used'    => false,
                ]);
            }
        } catch (\Throwable $e) {
            try { Log::error('OTP persistence (loginStart) failed: '.$e->getMessage()); } catch (\Throwable $_) {}
            try {
                // fallback to cache keyed by phone so loginWithOtp can find it
                Cache::put("otp:cache:phone:{$user->phone}", [
                    'code' => $code,
                    'created_at' => now()->toDateTimeString(),
                    'ttl' => $ttl,
                ], $ttl);
            } catch (\Throwable $_) {}
        }

        // Send SMS (do NOT log login yet; log after successful verify)
        $sms->send($user->phone, "کد ورود شما: {$code} (اعتبار: {$ttl} ثانیه)");

        return response()->json([
            'code'    => 'OK',
            'message' => 'OTP sent',
            'data'    => ['ttl' => $ttl],
        ]);
    }

    // POST /auth/check-identifier : { phone | email } -> { exists: bool }
    public function checkIdentifier(Request $r)
    {
        $r->validate([
            'phone' => ['nullable','string','max:20'],
            'email' => ['nullable','email','max:255'],
        ]);

        if ($r->filled('phone')) {
            $exists = User::where('phone', $r->phone)->exists();
            return response()->json(['code' => 'OK', 'message' => 'Checked', 'data' => ['exists' => $exists]]);
        }
        if ($r->filled('email')) {
            $exists = User::where('email', $r->email)->exists();
            return response()->json(['code' => 'OK', 'message' => 'Checked', 'data' => ['exists' => $exists]]);
        }
        return response()->json(['code' => 'INVALID', 'message' => 'Provide phone or email', 'data' => null], 422);
    }

    /** POST /auth/login-otp : phone + otp => token */
    public function loginWithOtp(Request $r)
    {
        $r->validate([
            'phone' => ['required','string','max:20','exists:users,phone'],
            'otp'   => ['required','string'],
        ]);

        $user = User::where('phone', $r->phone)->firstOrFail();
            // Prevent token issuance for inactive/suspended users
            if (! $user->is_active || $user->suspended_at !== null) {
                return response()->json([
                    'code' => 'USER_INACTIVE',
                    'message' => 'حساب شما فعال نیست و امکان ورود وجود ندارد.',
                    'data' => null,
                ], 403);
            }

        // محدودیت تلاش
        $vkey   = "otp:verify:{$user->id}";
        $vLimit = (int) config('otp.verify_limit', 5);
        $vCount = (int) Cache::get($vkey, 0);
        if ($vCount >= $vLimit) {
            return response()->json([
                'code' => 'TOO_MANY_ATTEMPTS',
                'message' => 'Too many attempts',
                'data' => null,
            ], 429);
        }
        Cache::put($vkey, $vCount + 1, (int) config('otp.window', 120));

        // OTP may have been created before the user existed and stored with phone
        $otp = null;
        try {
            if (Schema::hasColumn('otp_codes', 'phone')) {
                $otp = OtpCode::where('code', $r->otp)
                    ->where('is_used', false)
                    ->where(function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('phone', $user->phone);
                    })
                    ->orderByDesc('id')
                    ->first();
            } else {
                // Older schema or migration not applied: OTPs may be stored by user_id in DB.
                try {
                    $otp = OtpCode::where('code', $r->otp)
                        ->where('is_used', false)
                        ->where('user_id', $user->id)
                        ->orderByDesc('id')
                        ->first();
                    try { Log::info('loginWithOtp: db lookup without phone column', ['phone' => $user->phone, 'found' => !!$otp]); } catch (\Throwable $_) {}
                } catch (\Throwable $_) {
                    // ignore DB errors here and continue to cache fallback
                    try { Log::error('loginWithOtp: db lookup without phone failed', ['phone' => $user->phone, 'err' => $_->getMessage()]); } catch (\Throwable $__ ) {}
                    $otp = null;
                }

                if (! $otp) {
                    // check cache fallback keyed by phone
                    $cached = Cache::get("otp:cache:phone:{$user->phone}");
                    try { Log::info('loginWithOtp: cache lookup', ['phone' => $user->phone, 'cached' => $cached ?? null]); } catch (\Throwable $_) {}
                    if ($cached && isset($cached['code']) && $cached['code'] === $r->otp) {
                        try {
                            $created = $cached['created_at'] instanceof \DateTime ? \Carbon\Carbon::instance($cached['created_at']) : \Carbon\Carbon::parse($cached['created_at']);
                        } catch (\Throwable $_) { $created = now(); }
                        $expires = $created->addSeconds($cached['ttl'] ?? 120);
                        if (now()->lt($expires)) {
                            $otp = (object) [
                                'id' => null,
                                'user_id' => $user->id,
                                'code' => $cached['code'],
                                'expires_at' => $expires,
                                'is_used' => false,
                                'update' => function ($a) {},
                            ];
                            try { Log::info('loginWithOtp: cache matched OTP', ['phone' => $user->phone, 'code' => $cached['code']]); } catch (\Throwable $_) {}
                        }
                    } else {
                        try { Log::info('loginWithOtp: cache did not match', ['phone' => $user->phone, 'cached' => $cached ?? null, 'attempted' => $r->otp]); } catch (\Throwable $_) {}
                    }
                }
            }
        } catch (\Throwable $e) {
            // If schema check or query failed, log and fallback to cache lookup to avoid 500
            try { Log::error('OTP lookup failed: '.$e->getMessage()); } catch (\Throwable $_) {}
            $cached = Cache::get("otp:cache:phone:{$user->phone}");
            try { Log::info('loginWithOtp: fallback cache lookup after exception', ['phone' => $user->phone, 'cached' => $cached ?? null]); } catch (\Throwable $_) {}
            if ($cached && isset($cached['code']) && $cached['code'] === $r->otp) {
                try { $created = \Carbon\Carbon::parse($cached['created_at']); } catch (\Throwable $_) { $created = now(); }
                $expires = $created->addSeconds($cached['ttl'] ?? 120);
                if (now()->lt($expires)) {
                    $otp = (object) [
                        'id' => null,
                        'user_id' => $user->id,
                        'code' => $cached['code'],
                        'expires_at' => $expires,
                        'is_used' => false,
                        'update' => function ($a) {},
                    ];
                }
            }
        }

        if (! $otp) {
            return response()->json([
                'code' => 'INVALID_OTP',
                'message' => 'Invalid code',
                'data' => null,
            ], 422);
        }
        if (Carbon::parse($otp->expires_at)->isPast()) {
            return response()->json([
                'code' => 'OTP_EXPIRED',
                'message' => 'Code expired',
                'data' => null,
            ], 422);
        }
        $this->logLogin($user, 'otp', $r);

        // consume OTP: if this is a DB model, update; otherwise clear the cache
        if (is_object($otp) && method_exists($otp, 'update')) {
            try { $otp->update(['is_used' => true]); } catch (\Throwable $_) {}
        } else {
            try { Cache::forget("otp:cache:phone:{$user->phone}"); } catch (\Throwable $_) {}
        }

        // صدور توکن
        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;

        // پاک کردن شمارنده‌ها
        Cache::forget("otp:req:{$user->id}");
        Cache::forget("otp:verify:{$user->id}");

        $user->load('grade');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Login success',
            'data'    => [
                'token' => $token,
                'user'  => new AuthUserResource($user),
            ],
        ]);
    }

    /** POST /auth/verify-otp : phone + otp -> { valid: bool } (does NOT consume OTP) */
    public function verifyOtp(Request $r)
    {
        $r->validate([
            'phone' => ['required','string','max:20'],
            'otp'   => ['required','string'],
        ]);

        $phone = $r->phone;
        $maybeUser = User::where('phone', $phone)->first();

        if (Schema::hasColumn('otp_codes', 'phone')) {
            $otp = OtpCode::where('code', $r->otp)
                ->where('is_used', false)
                ->where(function ($q) use ($phone, $maybeUser) {
                    $q->where('phone', $phone);
                    if ($maybeUser) $q->orWhere('user_id', $maybeUser->id);
                })
                ->orderByDesc('id')
                ->first();
            if (! $otp) {
                return response()->json(['code' => 'INVALID_OTP', 'message' => 'Invalid code', 'data' => null], 422);
            }
            if (Carbon::parse($otp->expires_at)->isPast()) {
                return response()->json(['code' => 'OTP_EXPIRED', 'message' => 'Code expired', 'data' => null], 422);
            }
            return response()->json(['code' => 'OK', 'message' => 'Valid', 'data' => ['valid' => true]]);
        }

        // fallback to cache
        $cached = Cache::get("otp:cache:phone:{$phone}");
        if (! $cached || ! isset($cached['code']) || $cached['code'] !== $r->otp) {
            return response()->json(['code' => 'INVALID_OTP', 'message' => 'Invalid code', 'data' => null], 422);
        }
        try { $created = \Carbon\Carbon::parse($cached['created_at']); } catch (\Throwable $_) { $created = now(); }
        $expires = $created->addSeconds($cached['ttl'] ?? 120);
        if (now()->isAfter($expires)) {
            return response()->json(['code' => 'OTP_EXPIRED', 'message' => 'Code expired', 'data' => null], 422);
        }
        return response()->json(['code' => 'OK', 'message' => 'Valid', 'data' => ['valid' => true]]);
    }

    /** POST /auth/login-password : (فعلاً placeholder) */
    public function loginWithPassword(Request $r)
    {
        $r->validate([
            'phone'    => ['required','string','max:20'],
            'password' => ['required','string'],
        ]);

        $user = User::where('phone', $r->phone)->first();
        if (! $user) {
            return response()->json([
                'code' => 'USER_NOT_FOUND',
                'message' => 'This phone is not registered. Please sign up.',
                'data' => null,
            ], 404);
        }

        if (! $user->password || ! Hash::check($r->password, $user->password)) {
            return response()->json([
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'Phone or password is incorrect',
                'data'    => null,
            ], 422);
        }
            // Prevent token issuance for inactive/suspended users
            if (! $user->is_active || $user->suspended_at !== null) {
                return response()->json([
                    'code' => 'USER_INACTIVE',
                    'message' => 'حساب شما فعال نیست و امکان ورود وجود ندارد.',
                    'data' => null,
                ], 403);
            }

        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;
        $user->load('grade');
        $this->logLogin($user, 'password', $r);

        return response()->json([
            'code' => 'OK',
            'message' => 'Login success',
            'data' => ['token' => $token, 'user' => new AuthUserResource($user)],
        ]);
    }

    /** POST /auth/logout */
    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()?->delete();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Logged out',
            'data'    => null,
        ]);
    }

    /** GET /me */
    public function me(Request $r)
    {
        $user = $r->user()->load('grade');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Profile data',
            'data'    => new AuthUserResource($user),
        ]);
    }

    /**
     * Update current user's profile
     * PUT/PATCH /profile
     */
    public function updateProfile(Request $r)
    {
        $validated = $r->validate([
            'first_name'  => 'sometimes|string|max:100',
            'last_name'   => 'sometimes|string|max:100',
            'phone'       => 'sometimes|string|max:15',
            'email'       => 'sometimes|nullable|email|max:255',
            'city'        => 'sometimes|nullable|string|max:100',
            'province'    => 'sometimes|nullable|string|max:100',
            'school_name' => 'sometimes|nullable|string|max:255',
            'grade_id'    => 'sometimes|nullable|exists:grades,id',
        ]);

        $user = $r->user();
        $user->update($validated);
        $user->load('grade');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Profile updated successfully',
            'data'    => new AuthUserResource($user),
        ]);
    }

    /**
     * Upload and update user avatar
     * POST /profile/avatar
     */
    public function updateAvatar(Request $r)
    {
        $r->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        $user = $r->user();

        // Delete old avatar if exists and it's not a default/external URL
        if ($user->avatar && !str_starts_with($user->avatar, 'http')) {
            $oldPath = storage_path('app/public/' . $user->avatar);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        // Store new avatar
        $path = $r->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);
        $user->load('grade');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Avatar updated successfully',
            'data'    => new AuthUserResource($user),
        ]);
    }
}
