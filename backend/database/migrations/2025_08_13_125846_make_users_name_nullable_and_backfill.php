<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // اگر ستون name وجود دارد، nullable اش کن
        if (Schema::hasColumn('users', 'name')) {
            // بدون نیاز به doctrine/dbal
            DB::statement("ALTER TABLE users MODIFY name varchar(255) NULL");
        }

        // بک‌فیل برای رکوردهای قدیمی که name خالیه
        DB::statement("
            UPDATE users
            SET name = TRIM(CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,'')))
            WHERE (name IS NULL OR name = '')
              AND (first_name IS NOT NULL OR last_name IS NOT NULL)
        ");
    }

    public function down(): void
    {
        // برگشت: دوباره NOT NULL با مقدار خالی (تا ارور نده)
        if (Schema::hasColumn('users', 'name')) {
            DB::statement("UPDATE users SET name = '' WHERE name IS NULL");
            DB::statement("ALTER TABLE users MODIFY name varchar(255) NOT NULL DEFAULT ''");
        }
    }
};
