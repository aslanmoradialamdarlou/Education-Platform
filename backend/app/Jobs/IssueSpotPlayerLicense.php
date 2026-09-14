<?php

namespace App\Jobs;

use App\Models\Media\VideoLicense;
use App\Services\SpotPlayer\SpotPlayerClient;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\ThrottlesExceptionsWithBackoff;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class IssueSpotPlayerLicense implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public int $timeout = 60; // job-level timeout

    public function __construct(public int $licenseId) {}

    public function middleware(): array
    {
        // backoff سفارشی از config
        $backoff = config('spotplayer.backoff', [60,120,300,600,1800]);
        return [new ThrottlesExceptionsWithBackoff($backoff)];
    }

    public function backoff(): array
    {
        return config('spotplayer.backoff', [60,120,300,600,1800]);
    }

    public function retryUntil(): \DateTimeInterface
    {
        // حداکثر پنجره‌ی ریترای (مثلاً 2 ساعت)
        return now()->addHours(2);
    }

    public function handle(SpotPlayerClient $client): void
    {
        /** @var VideoLicense $lic */
        $lic = VideoLicense::query()->lockForUpdate()->findOrFail($this->licenseId);

        // اگر قبلاً صادر شده / یا failed نیست؟
        if ($lic->status === 'active' && $lic->license_key) {
            return;
        }
        if ($lic->status === 'revoked' || $lic->status === 'expired') {
            // سیاست: برای این حالت‌ها صادر نکن
            return;
        }

        // ساخت payload
        $watermark = $lic->watermark ?: ['texts' => [['text' => ($lic->user->phone ?? $lic->user->email ?? config('spotplayer.watermark_fallback'))]]];
        $device    = $lic->device ?: config('spotplayer.default_device');

        $payload = array_filter([
            'test'     => (bool) $lic->test,
            'course'   => $lic->courses ?: [],
            'name'     => $lic->name ?: ($lic->user->name ?? 'customer'),
            'payload'  => $lic->payload,
            'offline'  => Arr::get($lic->meta ?? [], 'offline'),
            'data'     => Arr::get($lic->meta ?? [], 'data'),
            'watermark'=> $watermark,
            'device'   => $device,
        ], fn($v) => !is_null($v));

        // اگر course الزامی خالی بود، fail منطقی
        if (empty($payload['course'])) {
            $lic->update([
                'status' => 'failed',
                'meta'   => array_merge($lic->meta ?? [], ['last_error' => 'No courses provided']),
            ]);
            return;
        }

        // تلاش برای ایجاد لایسنس
        try {
            $res = $client->createLicense($payload);
        } catch (\Throwable $e) {
            // خطای موقتی → پرتاب تا Queue ریترای کند
            throw $e;
        }

        // ذخیره خروجی
        DB::transaction(function () use ($lic, $res) {
            $lic->update([
                'status'      => 'active',
                'license_id'  => $res['_id'] ?? null,
                'license_key' => $res['key'] ?? null,
                'url'         => $res['url'] ?? null,
                'starts_at'   => now(),
                // ends_at: درصورت نیاز بعداً تمدید/ست می‌شود
                'meta'        => array_merge($lic->meta ?? [], ['issued_at' => now()->toDateTimeString()]),
            ]);
        });
    }

    public function failed(\Throwable $e): void
    {
        // اگر به سقف تلاش رسید
        try {
            $lic = VideoLicense::find($this->licenseId);
            if (!$lic) return;
            $lic->update([
                'status' => 'failed',
                'meta'   => array_merge($lic->meta ?? [], [
                    'last_error' => $e->getMessage(),
                    'failed_at'  => now()->toDateTimeString(),
                ]),
            ]);
        } catch (\Throwable) {}
    }
}
