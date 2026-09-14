<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private string $db;

    public function __construct()
    {
        $this->db = config('database.connections.'.config('database.default').'.database');
    }

    /* Helpers (بدون Doctrine) */
    private function columnExists(string $table, string $column): bool
    {
        $sql = "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1";
        return !empty(DB::select($sql, [$this->db, $table, $column]));
    }

    private function indexExists(string $table, string $index): bool
    {
        $sql = "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1";
        return !empty(DB::select($sql, [$this->db, $table, $index]));
    }

    public function up(): void
    {
        /* 1) subscription_plans → timestamps (اگر ندارند) */
        if (!$this->columnExists('subscription_plans', 'created_at')) {
            DB::statement("ALTER TABLE `subscription_plans` ADD COLUMN `created_at` timestamp NULL AFTER `is_active`");
        }
        if (!$this->columnExists('subscription_plans', 'updated_at')) {
            DB::statement("ALTER TABLE `subscription_plans` ADD COLUMN `updated_at` timestamp NULL AFTER `created_at`");
        }

        /* 2) coupons → timestamps (اختیاری ولی توصیه می‌شود) */
        if (!$this->columnExists('coupons', 'created_at')) {
            DB::statement("ALTER TABLE `coupons` ADD COLUMN `created_at` timestamp NULL AFTER `target_rule`");
        }
        if (!$this->columnExists('coupons', 'updated_at')) {
            DB::statement("ALTER TABLE `coupons` ADD COLUMN `updated_at` timestamp NULL AFTER `created_at`");
        }

        /* 3) plan_access → افزودن grade_id و subchapter_id برای دقت دسترسی */
        if (!$this->columnExists('plan_access', 'grade_id')) {
            DB::statement("ALTER TABLE `plan_access` ADD COLUMN `grade_id` BIGINT UNSIGNED NULL AFTER `plan_id`");
            // FK (در صورت وجود جدول grades)
            try {
                DB::statement("ALTER TABLE `plan_access` ADD CONSTRAINT `plan_access_grade_id_fk` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE SET NULL");
            } catch (\Throwable $e) { /* نادیده بگیر اگر از قبل وجود داشت */ }
        }
        if (!$this->columnExists('plan_access', 'subchapter_id')) {
            DB::statement("ALTER TABLE `plan_access` ADD COLUMN `subchapter_id` BIGINT UNSIGNED NULL AFTER `chapter_id`");
            try {
                DB::statement("ALTER TABLE `plan_access` ADD CONSTRAINT `plan_access_subchapter_id_fk` FOREIGN KEY (`subchapter_id`) REFERENCES `subchapters` (`id`) ON DELETE SET NULL");
            } catch (\Throwable $e) { /* ignore */ }
        }

        /* ایندکس‌های کمکی روی plan_access */
        if (!$this->indexExists('plan_access', 'plan_access_scope_idx')) {
            DB::statement("CREATE INDEX `plan_access_scope_idx` ON `plan_access` (`plan_id`, `grade_id`, `book_id`, `chapter_id`, `subchapter_id`)");
        }

        /* 4) ایندکس‌های گزارش/کارایی */
        if (!$this->indexExists('orders', 'orders_status_created_idx')) {
            DB::statement("CREATE INDEX `orders_status_created_idx` ON `orders` (`status`, `created_at`)");
        }
        if (!$this->indexExists('transactions', 'transactions_status_created_idx')) {
            DB::statement("CREATE INDEX `transactions_status_created_idx` ON `transactions` (`status`, `created_at`)");
        }
        if (!$this->indexExists('subscriptions', 'subscriptions_status_dates_idx')) {
            DB::statement("CREATE INDEX `subscriptions_status_dates_idx` ON `subscriptions` (`status`, `start_date`, `end_date`)");
        }
        if (!$this->indexExists('token_usages', 'token_usages_used_at_idx')) {
            DB::statement("CREATE INDEX `token_usages_used_at_idx` ON `token_usages` (`used_at`)");
        }
    }

    public function down(): void
    {
        // Down اختیاری: معمولاً روی پچ‌های شرطی نیاز نیست.
        // اگر لازم شد، می‌توان ستون‌ها/ایندکس‌ها را drop کرد.
    }
};
