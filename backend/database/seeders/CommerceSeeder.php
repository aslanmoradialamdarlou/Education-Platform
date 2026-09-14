<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CommerceSeeder extends Seeder
{
    public function run(): void
    {
        $users    = DB::table('users')->pluck('id')->all();
        $contents = DB::table('contents')->pluck('id')->all();
        $plans    = DB::table('subscription_plans')->pluck('id')->all();

        if (empty($users)) {
            $this->command?->warn('No users for CommerceSeeder.');
            return;
        }

        // 1) wallets (no timestamps in your table)
        foreach ($users as $uid) {
            DB::table('wallets')->updateOrInsert(
                ['user_id' => $uid],
                ['balance' => rand(0, 200000)]
            );
        }

        // 2) create ~15 orders
        for ($i = 1; $i <= 15; $i++) {
            $userId = $users[array_rand($users)];

            $orderId = DB::table('orders')->insertGetId([
                'user_id'      => $userId,
                'status'       => 'paid',
                'total_amount' => 0,
                'currency'     => 'IRR',
                'meta'         => json_encode([]),
                'created_at'   => now()->subDays(rand(1, 20)),
                'updated_at'   => now(),
                'paid_at'      => now()->subDays(rand(1, 20)),
            ]);

            $itemsTotal = 0;
            $itemsCount = rand(1, 3);

            for ($j = 1; $j <= $itemsCount; $j++) {
                $isPlan = $plans && rand(0, 1);

                if ($isPlan) {
                    $planId = $plans[array_rand($plans)];
                    $price  = (float) (DB::table('subscription_plans')->where('id', $planId)->value('price') ?? 100000);

                    DB::table('order_items')->insert([
                        'order_id'    => $orderId,
                        'item_type'   => 'subscription_plan',
                        'item_id'     => $planId,
                        'qty'         => 1,
                        'unit_price'  => $price,
                        'total_price' => $price,
                    ]);

                    $itemsTotal += $price;
                } else {
                    if (empty($contents)) {
                        continue;
                    }
                    $contentId = $contents[array_rand($contents)];
                    $price     = (float) rand(20000, 80000);

                    DB::table('order_items')->insert([
                        'order_id'    => $orderId,
                        'item_type'   => 'content',
                        'item_id'     => $contentId,
                        'qty'         => 1,
                        'unit_price'  => $price,
                        'total_price' => $price,
                    ]);

                    $itemsTotal += $price;
                }
            }

            // update order total
            DB::table('orders')->where('id', $orderId)->update([
                'total_amount' => $itemsTotal,
            ]);

            // 3) transaction (your enum: pending, paid, failed, refunded)
            DB::table('transactions')->insert([
                'order_id'       => $orderId,
                'user_id'        => $userId,
                'amount'         => $itemsTotal,
                'currency'       => 'IRR',
                'status'         => 'paid',
                'payment_method' => 'online',
                'ref_number'     => 'TRX-' . $orderId,
                'raw_payload'    => json_encode(['demo' => true]),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        $this->command?->info('✓ Commerce (orders, items, transactions, wallets) seeded.');
    }
}