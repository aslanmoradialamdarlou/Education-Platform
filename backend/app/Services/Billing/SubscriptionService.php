<?php
// app/Services/Billing/SubscriptionService.php
namespace App\Services\Billing;

use App\Models\Billing\{Subscription, SubscriptionPlan, SubscriptionEvent, TokenCounter};
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    /**
     * فعال‌سازی یک پلن برای کاربر (شروع/پایان، رویداد، اعطای توکن)
     */
    public function activatePlan(User $user, SubscriptionPlan $plan, ?string $startsAt = null): Subscription
    {
        return DB::transaction(function() use ($user,$plan,$startsAt) {
            $start = $startsAt ? now()->parse($startsAt)->toDateString() : now()->toDateString();
            $end   = now()->parse($start)->addDays($plan->duration_days)->toDateString();

            // اگر اشتراک فعال قبلی هست، می‌تونی منقضی/کنسل کنی یا اجازه بده موازی باشن (با policy خودت)
            $sub = Subscription::create([
                'user_id'    => $user->id,
                'plan_id'    => $plan->id,
                'start_date' => $start,
                'end_date'   => $end,
                'status'     => 'active',
            ]);

            SubscriptionEvent::create([
                'subscription_id' => $sub->id,
                'type' => 'created',
                'meta' => null,
                'created_at' => now(),
            ]);

            // اعطای توکن (Counter جدا برای هر پلن)
            $counter = TokenCounter::firstOrCreate(
                ['user_id' => $user->id, 'plan_id' => $plan->id],
                ['tokens_total' => 0, 'tokens_used' => 0, 'valid_until' => $end]
            );

            // اگر قبلاً valid_until کوتاه‌تره، تمدید کن
            if (!$counter->valid_until || $counter->valid_until->lt($end)) {
                $counter->valid_until = $end;
            }
            $counter->tokens_total += (int) $plan->token_quota;
            $counter->save();

            return $sub;
        });
    }
}
