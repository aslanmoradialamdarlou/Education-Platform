<?php

namespace Database\Seeders;

use App\Models\Curriculum\Chapter;
use App\Models\Curriculum\Subchapter;
use Illuminate\Database\Seeder;

class SubchaptersTableSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Chapter::all() as $chapter) {
            if ($chapter->subchapters()->exists()) {
                continue;
            }

            for ($i = 1; $i <= 3; $i++) {
                Subchapter::firstOrCreate(
                    ['chapter_id' => $chapter->id, 'number' => $i],
                    ['title' => "زیر‌فصل {$i}"]
                );
            }
        }
    }
}
