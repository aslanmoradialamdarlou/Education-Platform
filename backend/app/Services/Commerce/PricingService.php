<?php

namespace App\Services\Commerce;

use App\Models\Billing\SubscriptionPlan;

class PricingService
{
    /** جمع جزءسطرها بر اساس قیمت پلان‌ها */
    public function subtotal(array $items): int
    {
        $sum = 0;
        foreach ($items as $it) {
            if ($it['type'] === 'plan') {
                $plan = SubscriptionPlan::find($it['id']);
                if ($plan) {
                    $qty = max(1, (int)($it['qty'] ?? 1));
                    $sum += (int)$plan->price * $qty;
                }
            }
        }
        return $sum;
    }

    /** تبدیل اقلام ورودی به آرایه سفارش با قیمت واحد/جمع */
    public function buildOrderItems(array $items): array
    {
        $rows = [];
        foreach ($items as $it) {
            if ($it['type'] !== 'plan') continue;
            $plan = SubscriptionPlan::find($it['id']);
            if (!$plan) continue;

            $qty = max(1, (int)($it['qty'] ?? 1));
            $unit = (int)$plan->price;
            $rows[] = [
                'item_type' => 'plan',
                'item_id' => $plan->id,
                'qty' => $qty,
                'unit_price' => $unit,
                'total_price' => $unit * $qty,
            ];
        }
        return $rows;
    }
}
