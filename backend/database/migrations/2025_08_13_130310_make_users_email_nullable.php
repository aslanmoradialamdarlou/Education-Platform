<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ایمیل را nullable کن (بدون نیاز به doctrine/dbal)
        if (Schema::hasColumn('users', 'email')) {
            DB::statement("ALTER TABLE users MODIFY email varchar(255) NULL");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'email')) {
            // اگر برگشت خورد، nullها را خالی کن و NOT NULL
            DB::statement("UPDATE users SET email = '' WHERE email IS NULL");
            DB::statement("ALTER TABLE users MODIFY email varchar(255) NOT NULL");
        }
    }
};
