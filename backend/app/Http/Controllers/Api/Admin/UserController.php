<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct()
    {
        // Accept both canonical 'admin' and legacy 'Administrator' role names and use the api guard
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
        // اگر خواستی ریزتر:
        // $this->middleware('permission:users.view')->only(['index','show']);
        // $this->middleware('permission:users.create')->only(['store']);
        // $this->middleware('permission:users.update')->only(['update','suspend','activate']);
        // $this->middleware('permission:users.delete')->only(['destroy']);
    }

    /**
     * GET /api/v1/admin/users
     * فیلترها:
     * - q: جستجو در نام/تلفن/ایمیل
     * - role: بر اساس نقش (admin|teacher|student|guest)
     * - grade_id: هفتم/هشتم/نهم (id)
     * - subscription: all|none|active
     * - status: all|active|suspended
     * - per_page
     */
    public function index(Request $r)
    {
        $q = User::query()
            ->with(['grade','roles'])
            ->orderByDesc('id');

        if ($search = $r->query('q')) {
            $q->where(function($qq) use ($search) {
                $qq->where('first_name','like',"%{$search}%")
                    ->orWhere('last_name','like',"%{$search}%")
                    ->orWhere('phone','like',"%{$search}%")
                    ->orWhere('email','like',"%{$search}%");
            });
        }

        if ($role = $r->query('role')) {
            $q->whereHas('roles', fn($qr) => $qr->where('name', $role));
        }

        if ($r->filled('grade_id')) {
            $q->where('grade_id', $r->integer('grade_id'));
        }

        // وضعیت حساب
        $status = $r->query('status', 'all'); // all|active|suspended
        if ($status === 'active') {
            $q->where('is_active', true)->whereNull('suspended_at');
        } elseif ($status === 'suspended') {
            $q->whereNotNull('suspended_at');
        }

        // اشتراک
        $subscription = $r->query('subscription', 'all'); // all|none|active
        if ($subscription !== 'all') {
            $q->where(function($qq) use ($subscription) {
                $qq->whereHas('subscriptions', function($qs) use ($subscription) {
                    $qs->where('status','active')
                        ->where('start_date','<=', now()->toDateString())
                        ->where('end_date','>=', now()->toDateString());
                }, $subscription === 'active' ? '>' : '=', 0);
                // active => count > 0
                // none   => count = 0
            });
        }

        $perPage = $r->integer('per_page', 20);
        $users = $q->paginate($perPage);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Users list',
            'data'    => UserResource::collection($users),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/users
     */
    public function store(UserStoreRequest $req)
    {
        $data = $req->validated();

        $user = new User();
        $user->first_name = $data['first_name'];
        $user->last_name  = $data['last_name'];
        $user->name       = trim($data['first_name'].' '.$data['last_name']);
        $user->phone      = $data['phone'];
        $user->email      = $data['email'] ?? null;
        $user->grade_id   = $data['grade_id'] ?? null;
        $user->province   = $data['province'] ?? null;
        $user->city       = $data['city'] ?? null;
        $user->is_active  = $data['is_active'] ?? true;

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        if (!empty($data['roles'])) {
            $user->syncRoles($data['roles']); // از Spatie
        }

        $user->load(['grade','roles']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'User created',
            'data'    => new UserResource($user),
        ], 201);
    }

    /**
     * GET /api/v1/admin/users/{user}
     */
    public function show(User $user)
    {
        $user->load(['grade','roles','subscriptions.plan']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'User detail',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * PUT/PATCH /api/v1/admin/users/{user}
     */
    public function update(UserUpdateRequest $req, User $user)
    {
        $data = $req->validated();

        foreach (['first_name','last_name','phone','email','grade_id','province','city','is_active'] as $f) {
            if (array_key_exists($f,$data)) {
                $user->{$f} = $data[$f];
            }
        }

        if (array_key_exists('password', $data) && $data['password']) {
            $user->password = Hash::make($data['password']);
        }

        // بروزرسانی name
        if (array_key_exists('first_name',$data) || array_key_exists('last_name',$data)) {
            $user->name = trim(($data['first_name'] ?? $user->first_name).' '.($data['last_name'] ?? $user->last_name));
        }

        $user->save();

        if (array_key_exists('roles', $data)) {
            $user->syncRoles($data['roles'] ?? []);
        }

        $user->load(['grade','roles']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'User updated',
            'data'    => new UserResource($user),
        ]);
    }

    /**
     * DELETE /api/v1/admin/users/{user}
     */
    public function destroy(User $user)
    {
        // سیاست: اگر سوابق مهمی دارد، soft-delete بهتر است
        $user->delete();

        return response()->json([
            'code'    => 'OK',
            'message' => 'User deleted',
            'data'    => null,
        ]);
    }

    /**
     * PATCH /api/v1/admin/users/{user}/suspend
     */
    public function suspend(User $user)
    {
        $user->update([
            'is_active'    => false,
            'suspended_at' => now(),
        ]);

        return response()->json([
            'code'    => 'OK',
            'message' => 'User suspended',
            'data'    => new UserResource($user->fresh(['grade','roles'])),
        ]);
    }

    /**
     * PATCH /api/v1/admin/users/{user}/activate
     */
    public function activate(User $user)
    {
        $user->update([
            'is_active'    => true,
            'suspended_at' => null,
        ]);

        return response()->json([
            'code'    => 'OK',
            'message' => 'User activated',
            'data'    => new UserResource($user->fresh(['grade','roles'])),
        ]);
    }
}
