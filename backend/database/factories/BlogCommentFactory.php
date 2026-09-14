<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BlogCommentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'post_id'    => 1,   // override
            'user_id'    => 1,   // override
            'parent_id'  => null,
            'body'       => $this->faker->sentence(20),
            'status'     => 'approved',
            'created_at' => now()->subMinutes(rand(1, 2000)),
            'updated_at' => now(),
        ];
    }
}