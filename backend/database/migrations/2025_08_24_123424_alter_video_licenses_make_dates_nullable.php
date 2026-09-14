<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // اگر ستون‌ها وجود دارند، nullable بشن
        if (Schema::hasColumn('video_licenses', 'start_date')) {
            DB::statement("ALTER TABLE video_licenses MODIFY start_date date NULL");
        }
        if (Schema::hasColumn('video_licenses', 'end_date')) {
            DB::statement("ALTER TABLE video_licenses MODIFY end_date date NULL");
        }

        // همچنین مطمئن شو ENUM شامل pending هست (اگر قبلاً انجام ندادی)
        DB::statement("
            ALTER TABLE video_licenses
            MODIFY COLUMN status ENUM('pending','active','expired','revoked','failed')
            NOT NULL DEFAULT 'pending'
        ");
    }

    public function down(): void
    {
        // بازگشت به حالت قبلی (در صورت نیاز)
        if (Schema::hasColumn('video_licenses', 'start_date')) {
            DB::statement("ALTER TABLE video_licenses MODIFY start_date date NOT NULL");
        }
        if (Schema::hasColumn('video_licenses', 'end_date')) {
            DB::statement("ALTER TABLE video_licenses MODIFY end_date date NOT NULL");
        }
        DB::statement("
            ALTER TABLE video_licenses
            MODIFY COLUMN status ENUM('active','expired','revoked','failed')
            NOT NULL DEFAULT 'active'
        ");
    }
};
