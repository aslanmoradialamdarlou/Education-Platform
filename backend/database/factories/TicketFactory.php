<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TicketFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code'             => 'TCK-' . $this->faker->unique()->numerify('####'),
            'user_id'          => 1, // override
            'department_id'    => 1, // override
            'category_id'      => 1, // override
            'assignee_user_id' => null,
            'subject'          => 'مشکل: ' . $this->faker->sentence(4),
            'status'           => $this->faker->randomElement(['open','closed','pending']),
            'priority'         => $this->faker->randomElement(['low','normal','high']),
            'last_activity_at' => now(),
            'unread_for_user'  => false,
            'unread_for_support'=> false,
            'source'           => 'web',
            'meta'             => json_encode([]),
        ];
    }
}