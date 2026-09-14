<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Blog\BlogPost;
use App\Models\User;
use Carbon\Carbon;

class BlogPostSeeder extends Seeder
{
    public function run(): void
    {
        // Get first user as author (avoid role lookups that may fail)
        $author = User::first();
        if (!$author) {
            $author = User::factory()->create([
                'name' => 'نویسنده دمو',
                'email' => 'author@elmino.test',
                'phone' => '09120000001',
            ]);
        }

        $posts = [
            [
                'title' => 'آموزش کامل فصل اول علوم تجربی هفتم',
                'slug' => 'science-7th-chapter-1',
                'content' => '<p>در این مقاله به بررسی کامل فصل اول علوم تجربی پایه هفتم می‌پردازیم. این فصل شامل مباحث جانداران و محیط زیست است.</p><p>مطالب این فصل شامل موارد زیر است:</p><ul><li>آشنایی با اکوسیستم</li><li>زنجیره غذایی</li><li>تعادل در طبیعت</li></ul>',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(5),
            ],
            [
                'title' => 'نکات کلیدی ریاضی هشتم - فصل معادلات',
                'slug' => 'math-8th-equations-tips',
                'content' => '<p>معادلات یکی از مهم‌ترین فصل‌های ریاضی پایه هشتم است. در این مطلب نکات کلیدی و روش‌های حل مسائل را بررسی می‌کنیم.</p><h2>انواع معادلات</h2><p>معادلات خطی، معادلات درجه دوم و سیستم معادلات از جمله موضوعات این فصل هستند.</p>',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(3),
            ],
            [
                'title' => 'راهنمای جامع آزمون‌های تستی علوم نهم',
                'slug' => 'science-9th-test-guide',
                'content' => '<p>آمادگی برای آزمون‌های تستی علوم نهم نیازمند برنامه‌ریزی دقیق است. در این راهنما استراتژی‌های موثر را معرفی می‌کنیم.</p><p>نکات مهم:</p><ol><li>مرور منظم مطالب</li><li>حل تست‌های متنوع</li><li>مدیریت زمان در آزمون</li></ol>',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(1),
            ],
            [
                'title' => 'آزمایش‌های ساده علوم در خانه',
                'slug' => 'simple-science-experiments-at-home',
                'content' => '<p>می‌توانید با ابزار ساده در خانه آزمایش‌های علمی جالبی انجام دهید. این آزمایش‌ها به درک بهتر مفاهیم کمک می‌کند.</p><h2>آزمایش اول: واکنش جوش شیرین و سرکه</h2><p>این آزمایش ساده نشان‌دهنده واکنش‌های شیمیایی است.</p>',
                'status' => 'published',
                'published_at' => Carbon::now()->subHours(12),
            ],
            [
                'title' => 'چگونه برای امتحانات نهایی آماده شویم؟',
                'slug' => 'final-exam-preparation-tips',
                'content' => '<p>امتحانات نهایی از مهم‌ترین آزمون‌های تحصیلی هستند. برنامه‌ریزی صحیح کلید موفقیت است.</p><h2>مراحل آماده‌سازی</h2><ul><li>تهیه برنامه زمان‌بندی</li><li>مرور مستمر</li><li>تمرین با نمونه سوالات</li><li>استراحت کافی</li></ul>',
                'status' => 'published',
                'published_at' => Carbon::now()->subHours(6),
            ],
            [
                'title' => 'پیش‌نویس: مقاله در حال تکمیل',
                'slug' => 'draft-article-in-progress',
                'content' => '<p>این مقاله هنوز در حال تکمیل است و به زودی منتشر خواهد شد.</p>',
                'status' => 'draft',
                'published_at' => null,
            ],
        ];

        foreach ($posts as $postData) {
            BlogPost::firstOrCreate(
                ['slug' => $postData['slug']],
                array_merge($postData, ['author_id' => $author->id])
            );
        }

        $this->command->info('✓ Blog posts seeded successfully (' . count($posts) . ' posts)');
    }
}
