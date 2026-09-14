<?php

namespace App\Services\Commerce;


use App\Models\Billing\SubscriptionPlan;
use App\Models\Commerce\Order;
use App\Models\Commerce\OrderItem;
use App\Models\Commerce\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(
        private CouponService $coupons,
        private WalletService $wallets,
    ) {}

    /**
     * خروجی:
     *  - order
     *  - pricing: subtotal, discount, wallet_reserved, payable
     *  - payment: gateway, pay_url|null
     */
    public function createOrder(User $user, int $planId, int $qty = 1, ?string $couponCode = null, ?float $walletAmount = null, ?string $gateway = 'sandbox', ?string $returnUrl = null): array
    {
        /** @var SubscriptionPlan $plan */
        $plan = SubscriptionPlan::active()->findOrFail($planId);

        $qty = max(1, $qty);
        $subtotal = (float) bcmul((string)$plan->price, (string) $qty, 2);

        // کوپن
        $couponCheck = $this->coupons->validateForOrder($user, $couponCode, $plan);
        if (!$couponCheck['ok']) {
            // اگر کوپن نامعتبر بود، discount=0 ولی ادامه می‌دهیم (می‌توانی خطا برگردانی اگر بخواهی)
            $coupon = null;
            $discount = 0.0;
        } else {
            $coupon  = $couponCheck['coupon'];
            $discount = $coupon ? $this->coupons->discountAmount($coupon, $subtotal) : 0.0;
        }

        // مبلغ پس از تخفیف
        $afterDiscount = max(0.0, $subtotal - $discount);

        // رزرو کیف‌پول
        $balance = $this->wallets->getBalance($user);
        $maxWalletUsable = min($afterDiscount, $balance);
        $wantWallet = max(0.0, (float) ($walletAmount ?? 0));
        $walletToReserve = min($wantWallet, $maxWalletUsable);

        // مبلغ قابل پرداخت از درگاه
        $payable = max(0.0, $afterDiscount - $walletToReserve);

        // ساخت سفارش + آیتم + تراکنش‌ها
        $order = DB::transaction(function () use ($user, $plan, $qty, $subtotal, $discount, $coupon, $gateway, $payable) {
            /** @var Order $order */
            $order = Order::create([
                'user_id'      => $user->id,
                'status'       => 'pending',
                'total_amount' => $subtotal - $discount, // «پس از اعمال کوپن»
                'currency'     => $plan->currency ?? 'IRR',
            ]);

            OrderItem::create([
                'order_id'   => $order->id,
                'item_type'  => 'plan',
                'item_id'    => $plan->id,
                'qty'        => $qty,
                'unit_price' => $plan->price,
                'total_price'=> $subtotal,
            ]);

            if ($coupon) {
                // بعد از پرداخت موفق، redemption را ثبت می‌کنیم. (اینجا فقط نگه می‌داریم)
                // می‌توانی یک فیلد meta برای Order اضافه کنی؛ فعلاً یک تراکنش pending نوع "coupon" می‌سازیم:
                Transaction::create([
                    'order_id'       => $order->id,
                    'user_id'        => $user->id,
                    'amount'         => $discount,
                    'currency'       => $order->currency,
                    'status'         => 'pending',
                    'payment_method' => 'coupon',
                    'raw_payload'    => ['code' => $coupon->code],
                ]);
            }

            if ($payable > 0) {
                Transaction::create([
                    'order_id'       => $order->id,
                    'user_id'        => $user->id,
                    'amount'         => $payable,
                    'currency'       => $order->currency,
                    'status'         => 'pending',
                    'payment_method' => $gateway ?? 'sandbox',
                    'raw_payload'    => null,
                ]);
            }

            return $order;
        });

        // رزرو والت جدا از تراکنش DB تا deadlock نگیریم
        if ($walletToReserve > 0) {
            $this->wallets->reservePending($order->id, $user, $walletToReserve);
        }

        return [
            'order'   => $order->fresh(['items','transactions']),
            'pricing' => [
                'subtotal'        => $subtotal,
                'discount'        => $discount,
                'wallet_reserved' => $walletToReserve,
                'payable'         => $payable,
            ],
            'payment' => [
                'gateway' => $gateway ?? 'sandbox',
                // pay_url را بخش C می‌سازد (PaymentManager). در کنترلر برمی‌گردانیم.
                'return_url' => $returnUrl,
            ],
            'coupon'  => $coupon?->code,
        ];
    }
}
