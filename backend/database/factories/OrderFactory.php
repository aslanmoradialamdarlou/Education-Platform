<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'      => 1, // override
            'status'       => 'paid',
            'total_amount' => rand(50_000, 300_000),
            'currency'     => 'IRR',
            'meta'         => json_encode([]),
            'created_at'   => now()->subDays(rand(1, 15)),
            'updated_at'   => now(),
            'paid_at'      => now()->subDays(rand(1, 15)),
        ];
    }
}