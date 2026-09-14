<?php
// app/Listeners/ActivateSubscriptionsOnOrderPaid.php
namespace App\Listeners;

use App\Events\OrderPaid;
use App\Models\Billing\{Subscription, SubscriptionEvent, TokenCounter};
use App\Models\Commerce\{OrderItem, CouponRedemption};
use Illuminate\Support\Facades\DB;

class ActivateSubscriptionsOnOrderPaid
{
    public function handle(OrderPaid $event): void
    {
        $order = $event->order;
        $refNumber = $event->gatewayRef;

        // فقط سفارش‌های paid
        if ($order->status !== 'paid') return;

        DB::transaction(function () use ($order, $refNumber) {
            // جلوگیری از اجرای دوباره: اگر قبلاً رویداد ثبت شده، برگرد
            $already = DB::table('subscription_events')
                ->where('meta->order_id', $order->id)
                ->exists();
            if ($already) return;

            // برای هر آیتم پلان
            /** @var OrderItem $item */
            foreach ($order->items as $item) {
                if ($item->item_type !== 'plan') continue;

                $planId = (int) $item->item_id;
                $plan   = $item->plan; // رابطه belongsToMany/hasOne روی مدل OrderItem که قبلاً گذاشته بودیم
                if (!$plan) continue;

                // شروع و پایان اشتراک
                $start = now()->toDateString();
                $end   = now()->addDays($plan->duration_days)->toDateString();

                // آیا کاربر همین پلان را فعال دارد؟ (تمدید/تجمیع)
                $active = Subscription::where('user_id',$order->user_id)
                    ->where('plan_id',$planId)
                    ->where('status','active')
                    ->whereDate('end_date','>=', now()->toDateString())
                    ->orderByDesc('end_date')
                    ->first();

                if ($active) {
                    // تمدید: پایان را جلو ببر
                    $active->update(['end_date' => now()->parse($active->end_date)->addDays($plan->duration_days)->toDateString()]);
                    $sub = $active;
                    $eventType = 'renewed';
                } else {
                    // ایجاد اشتراک جدید
                    $sub = Subscription::create([
                        'user_id'    => $order->user_id,
                        'plan_id'    => $planId,
                        'start_date' => $start,
                        'end_date'   => $end,
                        'status'     => 'active',
                    ]);
                    $eventType = 'created';
                }

                // رویداد اشتراک
                SubscriptionEvent::create([
                    'subscription_id' => $sub->id,
                    'type'            => $eventType,
                    'meta'            => ['order_id'=>$order->id, 'order_item_id'=>$item->id, 'ref_number'=>$refNumber],
                ]);

                // شارژ توکن (تجمیعی/مجزا)
                $counter = TokenCounter::firstOrCreate(
                    ['user_id' => $order->user_id, 'plan_id' => $planId],
                    ['tokens_total' => 0, 'tokens_used' => 0, 'valid_until' => $sub->end_date]
                );

                // اگر valid_until قبلی جلوتر از اشتراک جدید بود، بلندترین را نگه داریم
                $valid = collect([$counter->valid_until, $sub->end_date])->filter()->max();
                $counter->update([
                    'tokens_total' => $counter->tokens_total + (int) $plan->token_quota,
                    'valid_until'  => $valid,
                ]);
            }

            // ثبت استفاده از کوپن (اگر وجود دارد و قبلاً ثبت نشده)
            if ($order->coupon_id) {
                $exists = CouponRedemption::where('coupon_id',$order->coupon_id)
                    ->where('user_id',$order->user_id)
                    ->where('order_id',$order->id)
                    ->exists();
                if (! $exists) {
                    CouponRedemption::create([
                        'coupon_id' => $order->coupon_id,
                        'user_id'   => $order->user_id,
                        'order_id'  => $order->id,
                        'used_at'   => now(),
                    ]);
                }
            }
        });
    }
}
