<?php
// app/Services/Billing/OrderFulfillmentService.php
namespace App\Services\Billing;

use App\Models\Billing\{Subscription, SubscriptionEvent, TokenCounter, SubscriptionPlan};
use App\Models\Commerce\{Coupon, CouponRedemption, Order, OrderItem};
use Illuminate\Support\Facades\DB;

class OrderFulfillmentService
{
    /**
     * ایدمپوتنت: اگر قبلاً Fulfill شده باشد دوباره چیزی ایجاد نمی‌کند.
     */
    public function fulfillPaidOrder(Order $order): void
    {
        // نکته: فرض می‌گیریم status=paid در مرحله‌ی درگاه تنظیم شده.
        // اینجا فقط تحویل آیتم‌ها + ریدمشن کوپن را تضمین می‌کنیم.

        DB::transaction(function () use ($order) {
            $order->loadMissing(['items', 'user']);

            // 1) فعال‌سازی آیتم‌های پلن
            foreach ($order->items as $it) {
                if ($it->item_type !== 'plan') continue;

                /** @var SubscriptionPlan|null $plan */
                $plan = SubscriptionPlan::find($it->item_id);
                if (! $plan) continue;

                // آیا برای این سفارش قبلاً اشتراک ساخته شده؟
                $sub = Subscription::query()
                    ->where('user_id', $order->user_id)
                    ->where('plan_id', $plan->id)
                    ->whereDate('start_date', now()->toDateString())
                    ->where('status', 'active')
                    ->first();

                if (! $sub) {
                    $start = now()->startOfDay();
                    $end   = (clone $start)->addDays($plan->duration_days)->endOfDay();

                    $sub = Subscription::create([
                        'user_id' => $order->user_id,
                        'plan_id' => $plan->id,
                        'start_date' => $start->toDateString(),
                        'end_date'   => $end->toDateString(),
                        'status'     => 'active',
                    ]);

                    SubscriptionEvent::create([
                        'subscription_id' => $sub->id,
                        'type' => 'created',
                        'meta' => ['order_id' => $order->id],
                    ]);
                }

                // 2) توکن‌ها: اگر برای این پلن قبلاً کانتر هست → افزایش؛ وگرنه ایجاد
                $counter = TokenCounter::query()
                    ->where('user_id', $order->user_id)
                    ->where('plan_id', $plan->id)
                    ->first();

                if ($counter) {
                    $counter->update([
                        'tokens_total' => $counter->tokens_total + (int) $plan->token_quota,
                        // valid_until را می‌توان به بیشترین تاریخ تمدید کرد:
                        'valid_until'  => $this->maxDate($counter->valid_until, $sub->end_date),
                    ]);
                } else {
                    TokenCounter::create([
                        'user_id'      => $order->user_id,
                        'plan_id'      => $plan->id,
                        'tokens_total' => (int) $plan->token_quota,
                        'tokens_used'  => 0,
                        'valid_until'  => $sub->end_date,
                    ]);
                }
            }

            // 3) ثبت ریدمشن کوپن (اختیاری/دفاعی)
            // سناریوهای ممکن:
            //   الف) شما کوپن را قبل از پرداخت validate کرده‌اید و فقط می‌خواهید پس از PAID ریدمشن بسازید
            //   ب) کوپن در order.meta ذخیره شده
            //   ج) کوپن به عنوان یک order_item با item_type='coupon' آمده
            //
            // من هر دو مسیر (meta یا آیتم) را پشتیبانی دفاعی می‌کنم؛ هر کدام موجود بود ثبت می‌شود.

            $couponId = null;

            // مسیر A: اگر ستونی به نام meta در جدول orders دارید و coupon_id داخل آن ذخیره شده:
            if (property_exists($order, 'meta') && is_array($order->meta ?? null)) {
                $couponId = $order->meta['coupon_id'] ?? null;
            }

            // مسیر B: اگر یک آیتم 'coupon' داشتید
            if (! $couponId) {
                /** @var OrderItem|null $couponItem */
                $couponItem = $order->items->firstWhere('item_type', 'coupon');
                if ($couponItem) {
                    $couponId = $couponItem->item_id;
                }
            }

            if ($couponId) {
                // بررسی: آیا قبلاً برای این order ریدمشن ثبت شده؟
                $exists = CouponRedemption::query()
                    ->where('order_id', $order->id)
                    ->exists();

                if (! $exists) {
                    // وجود کوپن
                    $coupon = Coupon::find($couponId);
                    if ($coupon) {
                        CouponRedemption::create([
                            'coupon_id' => $coupon->id,
                            'user_id'   => $order->user_id,
                            'order_id'  => $order->id,
                            'used_at'   => now(),
                        ]);
                    }
                }
            }
        });
    }

    private function maxDate(?string $a, ?string $b): ?string
    {
        if (!$a) return $b;
        if (!$b) return $a;
        return (strtotime($a) >= strtotime($b)) ? $a : $b;
    }
}
