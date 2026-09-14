<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BlogDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1) base categories
        $categories = [
            'اخبار آموزش',
            'راهنمای معلم',
            'نکات امتحانی',
            'آزمایش‌های علوم',
        ];

        $categoryIds = [];
        foreach ($categories as $cat) {
            $slug = Str::slug($cat, '-');
            DB::table('blog_categories')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name'       => $cat,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            $categoryIds[] = DB::table('blog_categories')->where('slug', $slug)->value('id');
        }

        // 2) base tags
        $tags = [
            'هفتم',
            'هشتم',
            'نهم',
            'ریاضی',
            'علوم',
            'امتحان نهایی',
        ];
        $tagIds = [];
        foreach ($tags as $tag) {
            $slug = Str::slug($tag, '-');
            DB::table('blog_tags')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name'       => $tag,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            $tagIds[] = DB::table('blog_tags')->where('slug', $slug)->value('id');
        }

        // 3) fetch posts (from your BlogPostSeeder)
        $posts = DB::table('blog_posts')->get();

        // if there is no post, just create 3 quick ones
        if ($posts->isEmpty()) {
            $postsData = [
                [
                    'title'        => 'اولین پست آزمایشی',
                    'slug'         => 'first-demo-post',
                    'content'      => '<p>این یک پست آزمایشی است.</p>',
                    'excerpt'      => 'پست آزمایشی',
                    'author_id'    => DB::table('users')->inRandomOrder()->value('id'),
                    'status'       => 'published',
                    'published_at' => now()->subDay(),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ],
                [
                    'title'        => 'نکات آزمون علوم',
                    'slug'         => 'science-tips',
                    'content'      => '<p>نکات مهم آزمون علوم</p>',
                    'excerpt'      => 'نکات مهم',
                    'author_id'    => DB::table('users')->inRandomOrder()->value('id'),
                    'status'       => 'published',
                    'published_at' => now()->subDays(2),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ],
            ];
            DB::table('blog_posts')->insert($postsData);
            $posts = DB::table('blog_posts')->get();
        }

        // 4) attach categories & tags to posts
        foreach ($posts as $post) {
            // categories (1-2 random)
            $pickCats = collect($categoryIds)->shuffle()->take(rand(1, 2))->all();
            foreach ($pickCats as $cid) {
                DB::table('blog_category_post')->updateOrInsert(
                    [
                        'blog_post_id'    => $post->id,
                        'blog_category_id'=> $cid,
                    ],
                    []
                );
            }

            // tags (1-3 random)
            $pickTags = collect($tagIds)->shuffle()->take(rand(1, 3))->all();
            foreach ($pickTags as $tid) {
                DB::table('blog_post_tag')->updateOrInsert(
                    [
                        'blog_post_id' => $post->id,
                        'blog_tag_id'  => $tid,
                    ],
                    []
                );
            }
        }

        // 5) comments + likes
        $userIds = DB::table('users')->pluck('id')->all();

        foreach ($posts as $post) {
            // 0–4 comments
            $commentsCount = rand(0, 4);
            for ($i = 1; $i <= $commentsCount; $i++) {
                $uid = $userIds[array_rand($userIds)];
                $commentId = DB::table('blog_comments')->insertGetId([
                    'post_id'    => $post->id,
                    'user_id'    => $uid,
                    'parent_id'  => null,
                    'body'       => 'نظر تستی شماره ' . $i . ' برای پست ' . $post->title,
                    'status'     => 'approved',
                    'created_at' => now()->subMinutes(rand(1, 500)),
                    'updated_at' => now(),
                ]);

                // maybe one reply
                if (rand(0, 1)) {
                    $responder = $userIds[array_rand($userIds)];
                    DB::table('blog_comments')->insert([
                        'post_id'    => $post->id,
                        'user_id'    => $responder,
                        'parent_id'  => $commentId,
                        'body'       => 'پاسخ به نظر ' . $i,
                        'status'     => 'approved',
                        'created_at' => now()->subMinutes(rand(1, 500)),
                        'updated_at' => now(),
                    ]);
                }
            }

            // likes: 0–6
            $likesCount = rand(0, 6);
            $shuffledUsers = collect($userIds)->shuffle()->take($likesCount);
            foreach ($shuffledUsers as $uid) {
                DB::table('blog_likes')->updateOrInsert(
                    [
                        'post_id' => $post->id,
                        'user_id' => $uid,
                    ],
                    [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        $this->command?->info('✓ Blog categories/tags/pivots/comments/likes seeded.');
    }
}