<?php

namespace App\Services\Commerce;

use App\Models\Billing\SubscriptionPlan;
use App\Models\Commerce\Coupon;
use App\Models\Commerce\CouponRedemption;
use App\Models\User;
use Illuminate\Support\Arr;

class CouponService
{
    /**
     * اعتبارسنجی کوپن برای یک سفارش شامل یک پلان (یا آیتم منتخب).
     * اگر سفارش چند آیتمی داری، از validateAndPrice() استفاده کن که آرایه آیتم‌ها را می‌گیرد.
     */
    public function validateForOrder(?User $user, ?string $code, SubscriptionPlan $plan): array
    {
        if (!$code) {
            return ['ok'=>true, 'amount'=>0, 'coupon'=>null, 'reason'=>null];
        }

        $coupon = Coupon::query()
            ->where('code', $code)
            ->where('is_active', true)
            ->first();

        if (!$coupon) {
            return ['ok'=>false, 'amount'=>0, 'coupon'=>null, 'reason'=>'invalid_or_inactive'];
        }

        $now = now();
        if ($coupon->starts_at && $now->lt($coupon->starts_at)) {
            return ['ok'=>false, 'amount'=>0, 'coupon'=>$coupon, 'reason'=>'not_started'];
        }
        if ($coupon->ends_at && $now->gt($coupon->ends_at)) {
            return ['ok'=>false, 'amount'=>0, 'coupon'=>$coupon, 'reason'=>'expired'];
        }

        // سقف‌های استفاده (نهایی را هنگام redemption هم enforce کن)
        if ($coupon->max_uses !== null) {
            $used = CouponRedemption::where('coupon_id', $coupon->id)->count();
            if ($used >= $coupon->max_uses) {
                return ['ok'=>false, 'amount'=>0, 'coupon'=>$coupon, 'reason'=>'max_uses_reached'];
            }
        }
        if ($user && $coupon->per_user_limit !== null) {
            $usedByUser = CouponRedemption::where('coupon_id', $coupon->id)
                ->where('user_id', $user->id)->count();
            if ($usedByUser >= $coupon->per_user_limit) {
                return ['ok'=>false, 'amount'=>0, 'coupon'=>$coupon, 'reason'=>'per_user_limit_reached'];
            }
        }

        // هدف‌گیری یکنواخت
        $rule = $coupon->target_rule ?: [];
        if (!$this->eligibleForRule($user, [$plan], $rule)) {
            return ['ok'=>false, 'amount'=>0, 'coupon'=>$coupon, 'reason'=>'not_eligible'];
        }

        return ['ok'=>true, 'amount'=>0, 'coupon'=>$coupon, 'reason'=>null];
    }

    /**
     * سفارش چند آیتمی (plan-only). items: [{type:'plan', id:.., qty:..}, ...]
     * subtotal به ریال (int)
     */
    public function validateAndPrice(?string $code, User $user, int $subtotal, array $items): array
    {
        if (!$code) return ['coupon'=>null,'discount'=>0,'reason'=>null];

        $coupon = Coupon::where('code',$code)->where('is_active', true)->first();
        if (!$coupon) return ['coupon'=>null,'discount'=>0,'reason'=>'invalid_or_inactive'];

        $now = now();
        if ($coupon->starts_at && $now->lt($coupon->starts_at)) return ['coupon'=>null,'discount'=>0,'reason'=>'not_started'];
        if ($coupon->ends_at   && $now->gt($coupon->ends_at))   return ['coupon'=>null,'discount'=>0,'reason'=>'expired'];

        // استخراج پلان‌ها از آیتم‌ها
        $plans = collect($items)
            ->where('type', 'plan')
            ->pluck('id')
            ->unique()
            ->values()
            ->map(fn($id) => SubscriptionPlan::find($id))
            ->filter()
            ->all();

        $rule = $coupon->target_rule ?? [];
        if (!$this->eligibleForRule($user, $plans, $rule)) {
            return ['coupon'=>null,'discount'=>0,'reason'=>'not_eligible'];
        }

        $discount = $this->discountAmountInt($coupon, $subtotal);

        return ['coupon'=>$coupon, 'discount'=>$discount, 'reason'=>null];
    }

    /** محاسبه تخفیف (int ریال) */
    public function discountAmountInt(Coupon $coupon, int $subtotal): int
    {
        if ($subtotal <= 0) return 0;

        $type  = strtolower($coupon->type); // percent|fixed
        $value = (float) $coupon->value;

        if ($type === 'percent') {
            $discount = (int) floor($subtotal * ($value/100));
        } else {
            $discount = (int) $value;
        }

        return max(0, min($discount, $subtotal));
    }

    /** ثبت مصرف کوپن بعد از پرداخت موفق */
    public function recordRedemption(Coupon $coupon, int $userId, int $orderId): void
    {
        CouponRedemption::create([
            'coupon_id' => $coupon->id,
            'user_id'   => $userId,
            'order_id'  => $orderId,
            'used_at'   => now(),
        ]);
    }

    /** ارزیابی eligibility طبق فرمت یکپارچهٔ rule */
    private function eligibleForRule(?User $user, array $plans, array $rule): bool
    {
        if (empty($rule)) return true;
        if (Arr::get($rule, 'everyone') === true) return true;

        // phones
        if ($phones = Arr::get($rule, 'phones')) {
            if (!$user || !in_array($user->phone, (array)$phones, true)) return false;
        }
        // roles
        if ($roles = Arr::get($rule, 'roles')) {
            if (!$user) return false;
            $userRoles = method_exists($user, 'getRoleNames') ? $user->getRoleNames()->toArray() : [];
            if (!array_intersect($userRoles, (array)$roles)) return false;
        }
        // plan_ids
        if ($planIds = Arr::get($rule,'plan_ids')) {
            $planIds = array_map('intval', (array)$planIds);
            $orderPlanIds = array_map(fn($p)=> (int)$p->id, $plans);
            if (!array_intersect($orderPlanIds, $planIds)) return false;
        }
        // grade_ids (اگر PlanAccess grade_id داری)
        if ($gradeIds = Arr::get($rule, 'grade_ids')) {
            $gradeIds = array_map('intval', (array)$gradeIds);
            $anyMatch = false;
            foreach ($plans as $p) {
                $pGrades = $p->accesses()
                    ->whereNotNull('grade_id')
                    ->pluck('grade_id')
                    ->map('intval')
                    ->unique()
                    ->all();
                if (array_intersect($pGrades, $gradeIds)) { $anyMatch = true; break; }
            }
            if (!$anyMatch) return false;
        }

        return true;
    }
}
