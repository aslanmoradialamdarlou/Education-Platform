<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $subchapters = DB::table('subchapters')->get();
        if ($subchapters->isEmpty()) {
            $this->command?->warn('No subchapters found, skipping ContentSeeder.');
            return;
        }

        // make sure we have some tags
        $baseTags = ['ویدیو', 'جزوه', 'تمرین', 'نمونه سوال'];
        $tagIds = [];
        foreach ($baseTags as $t) {
            $slug = Str::slug($t, '-');
            DB::table('content_tags')->updateOrInsert(
                ['slug' => $slug],
                ['name' => $t]
            );
            $tagIds[] = DB::table('content_tags')->where('slug', $slug)->value('id');
        }

        // pick content types
        $typeIds = DB::table('content_types')->pluck('id')->all();
        if (empty($typeIds)) {
            $typeIds = [DB::table('content_types')->insertGetId(['name' => 'جزوه', 'slug' => 'jazve'])];
        }

        foreach ($subchapters as $sub) {
            $count = rand(2, 4);
            for ($i = 1; $i <= $count; $i++) {

                $isFree = (bool) rand(0, 1);
                $tokenPrice = $isFree ? 0 : rand(5, 30);

                $cid = DB::table('contents')->insertGetId([
                    'type_id'        => $typeIds[array_rand($typeIds)],
                    'subchapter_id'  => $sub->id,
                    'title'          => "محتوای {$i} برای زیر‌فصل {$sub->title}",
                    'description'    => 'توضیحات کوتاه درباره این محتوا.',
                    'is_free'        => $isFree,
                    'view_count'     => rand(0, 150),
                    'download_count' => rand(0, 40),
                    'pages'          => rand(1, 12),
                    'token_price'    => $tokenPrice,   // 👈 never null
                    'created_at'     => now()->subDays(rand(1, 30)),
                    'updated_at'     => now(),
                ]);

                // attach 0–2 tags
                $pick = collect($tagIds)->shuffle()->take(rand(0, 2))->all();
                foreach ($pick as $tid) {
                    DB::table('content_tag_pivot')->updateOrInsert(
                        ['content_id' => $cid, 'tag_id' => $tid],
                        []
                    );
                }
            }
        }

        $this->command?->info('✓ Contents seeded for existing subchapters.');
    }
}