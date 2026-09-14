<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type_id'       => 1,        // override
            'subchapter_id' => 1,        // override
            'difficulty'    => $this->faker->randomElement(['easy','medium','hard']),
            'source'        => 'کتاب درسی',
            'book_page'     => rand(5, 140),
            'question_text' => 'سؤال: ' . $this->faker->sentence(10),
            'answer_text'   => 'پاسخ: ' . $this->faker->sentence(8),
            'status'        => 'published',
            'is_free'       => $this->faker->boolean(),
            'created_at'    => now(),
            'updated_at'    => now(),
        ];
    }
}