<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Billing\SubscriptionPlan;
use Illuminate\Support\Facades\DB;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('subscription_plans')->delete();

        $plans = [
            [
                'name'          => 'اشتراک طلایی',
                'slug'          => 'golden',
                'description'   => 'دسترسی کامل به تمام محتوای سایت',
                'price'         => 350000,
                'currency'      => 'IRR',
                'duration_days' => 365,
                'token_quota'   => 1000,
                'is_active'     => true,
            ],
            [
                'name'          => 'اشتراک پایه - پایه هفتم',
                'slug'          => 'grade-7',
                'description'   => 'دسترسی کامل به محتوای پایه هفتم',
                'price'         => 150000,
                'currency'      => 'IRR',
                'duration_days' => 365,
                'token_quota'   => 200,
                'is_active'     => true,
            ],
            [
                'name'          => 'اشتراک فصلی - فصل ۱ علوم هفتم',
                'slug'          => 'chapter-science-7-1',
                'description'   => 'دسترسی به محتوای فصل ۱ کتاب علوم پایه هفتم',
                'price'         => 50000,
                'currency'      => 'IRR',
                'duration_days' => 90,
                'token_quota'   => 50,
                'is_active'     => true,
            ],
        ];

        foreach ($plans as $planData) {
            SubscriptionPlan::create($planData);
        }

        $this->command->info('✓ Subscription plans seeded successfully.');
    }
}
