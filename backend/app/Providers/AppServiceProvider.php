<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\Sms\SmsService::class, function () {
            return match (config('otp.driver', 'log')) {
                'kavenegar' => new \App\Services\Sms\Drivers\KavenegarSmsService(config('otp.kavenegar_api_key')),
                default     => new \App\Services\Sms\Drivers\LogSmsService(),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });


        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // اگر بخوای برای OTP هم ریتم جدا داشته باشی:
        RateLimiter::for('otp-request', function (Request $request) {
            // مثلا 5 بار در 2 دقیقه
            return Limit::perMinutes(2, 5)->by($request->ip());
        });

        RateLimiter::for('otp-verify', function (Request $request) {
            // مثلا 5 تلاش در 2 دقیقه
            return Limit::perMinutes(2, 5)->by($request->ip());
        });
    }
}
