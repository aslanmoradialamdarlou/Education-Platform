<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // اضافه کردن مقدار 'pending' و تنظیم پیش‌فرض روی pending
        DB::statement("
            ALTER TABLE video_licenses
            MODIFY COLUMN status ENUM('pending','active','expired','revoked','failed')
            NOT NULL DEFAULT 'pending'
        ");
    }

    public function down(): void
    {
        // بازگشت به حالت قبلی (در صورت نیازت)
        DB::statement("
            ALTER TABLE video_licenses
            MODIFY COLUMN status ENUM('active','expired','revoked','failed')
            NOT NULL DEFAULT 'active'
        ");
    }
};
