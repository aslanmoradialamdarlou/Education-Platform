<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ContentFactory extends Factory
{
    // protected $model = \App\Models\Content::class;

    public function definition(): array
    {
        return [
            'type_id'        => 1, // override
            'subchapter_id'  => 1, // override
            'title'          => 'محتوای ' . $this->faker->words(3, true),
            'description'    => $this->faker->sentence(15),
            'is_free'        => $this->faker->boolean(),
            'view_count'     => rand(0, 200),
            'download_count' => rand(0, 50),
            'pages'          => rand(1, 15),
            'token_price'    => $this->faker->boolean() ? rand(5, 30) : null,
        ];
    }
}