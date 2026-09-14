<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // your originals
            RolePermissionSeeder::class,
            CoreCatalogSeeder::class,
            ContentTypeSeeder::class,
            DemoAdminSeeder::class,

            // users + blog
            DummyUsersSeeder::class,
            BlogPostSeeder::class,     // your original
            BlogDataSeeder::class,

            // curriculum content
            ChaptersTableSeeder::class,
            SubchaptersTableSeeder::class,
            ContentSeeder::class,
            ContentViewSeeder::class,

            // questions/exams
            QuestionBankSeeder::class,
            ExamSupportSeeder::class,
            ExamDemoSeeder::class,

            // business
            SubscriptionPlanSeeder::class,
            CommerceSeeder::class,
            PlanAccessSeeder::class,

            // support
            SupportSeeder::class,

            // system
            NotificationSeeder::class,
            AuditLogSeeder::class,
            WebhookEventSeeder::class,
        ]);
    }
}