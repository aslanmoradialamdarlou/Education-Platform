<?php

namespace App\Services\Billing;

use App\Models\Commerce\Order;
use App\Models\Billing\{Subscription, SubscriptionEvent, SubscriptionPlan, TokenCounter};
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SubscriptionActivator
{
    /**
     * فعال‌سازی اشتراک برای یک کاربر روی یک پلن خاص
     * - اگر اشتراک active همان پلن وجود داشت: تمدید/به‌روزرسانی تاریخ‌ها
     * - اگر نبود: ایجاد اشتراک جدید
     * - شارژ/به‌روزرسانی TokenCounter با quota پلن
     */
    public function activate(User $user, SubscriptionPlan $plan, ?int $durationDays = null): Subscription
    {
        return DB::transaction(function () use ($user, $plan, $durationDays) {

            $start = now()->toDateString();
            $end   = now()->addDays($durationDays ?? (int)$plan->duration_days)->toDateString();

            // اشتراک فعال موجود؟
            /** @var Subscription|null $sub */
            $sub = Subscription::query()
                ->where('user_id', $user->id)
                ->where('plan_id', $plan->id)
                ->where('status', 'active')
                ->whereDate('end_date', '>=', now()->toDateString())
                ->lockForUpdate()
                ->first();

            if ($sub) {
                // تمدید: تاریخ پایان را به جلو ببریم (ساده‌ترین مدل)
                $sub->update([
                    'end_date' => $end,
                ]);
                $type = 'renewed';
            } else {
                $sub = Subscription::create([
                    'user_id'   => $user->id,
                    'plan_id'   => $plan->id,
                    'start_date'=> $start,
                    'end_date'  => $end,
                    'status'    => 'active',
                ]);
                $type = 'created';
            }

            // رویداد
            SubscriptionEvent::create([
                'subscription_id' => $sub->id,
                'type'            => $type,
                'meta'            => ['by' => 'system', 'at' => now()->toDateTimeString()],
            ]);

            // شارژ توکن: TokenCounter (unique by user_id, plan_id)
            /** @var TokenCounter $counter */
            $counter = TokenCounter::query()
                ->where('user_id', $user->id)
                ->where('plan_id', $plan->id)
                ->lockForUpdate()
                ->first();

            if ($counter) {
                // ساده: quota جدید را به tokens_total اضافه کن
                $counter->update([
                    'tokens_total' => $counter->tokens_total + (int)$plan->token_quota,
                    'valid_until'  => $end,
                ]);
            } else {
                TokenCounter::create([
                    'user_id'     => $user->id,
                    'plan_id'     => $plan->id,
                    'tokens_total'=> (int)$plan->token_quota,
                    'tokens_used' => 0,
                    'valid_until' => $end,
                ]);
            }

            return $sub;
        });
    }

    /**
     * فعال‌سازی اشتراک بر اساس آیتم‌های سفارش پرداخت‌شده
     * - انتظار داریم order_items شامل پلن‌ها باشد (item_type = plan, item_id = plan_id)
     */
    public function activateFromOrder(Order $order): array
    {
        $user = $order->user;
        $activated = [];

        foreach ($order->items as $it) {
            if ($it->item_type !== 'plan') {
                continue;
            }
            $plan = SubscriptionPlan::find($it->item_id);
            if (!$plan) {
                $activated[] = ['item_id'=>$it->id,'status'=>'skipped','reason'=>'plan_not_found'];
                continue;
            }

            $sub = $this->activate($user, $plan, null);
            $activated[] = [
                'item_id' => $it->id,
                'status'  => 'ok',
                'subscription_id' => $sub->id,
                'plan_id' => $plan->id,
            ];
        }

        return $activated;
    }
}
