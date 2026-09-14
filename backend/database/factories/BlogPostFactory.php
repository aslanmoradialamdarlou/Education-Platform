<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BlogPostFactory extends Factory
{
    // if your model is not auto-guessed:
    // protected $model = \App\Models\Blog\BlogPost::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(5, true);

        return [
            'title'            => $title,
            'slug'             => Str::slug($title) . '-' . $this->faker->unique()->numberBetween(100, 999),
            'content'          => '<p>' . $this->faker->paragraph(5) . '</p>',
            'excerpt'          => $this->faker->sentence(10),
            'cover_image_url'  => null,
            'meta_title'       => $title,
            'meta_description' => $this->faker->sentence(15),
            'meta_keywords'    => 'آموزش,مدرسه,المان',
            'canonical_url'    => null,
            'reading_time'     => rand(2, 8),
            'is_pinned'        => false,
            'author_id'        => 1, // override in seeder
            'status'           => 'published',
            'published_at'     => now()->subDays(rand(0, 10)),
        ];
    }

    public function draft(): self
    {
        return $this->state(fn () => [
            'status'       => 'draft',
            'published_at' => null,
        ]);
    }
}