<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            if (!Schema::hasColumn('users','is_active')) {
                $t->boolean('is_active')->default(true)->after('email_verified_at');
            }
            if (!Schema::hasColumn('users','suspended_at')) {
                $t->timestamp('suspended_at')->nullable()->after('is_active');
            }
            // برای لیست‌ها
            if (!Schema::hasColumn('users','created_at')) {
                $t->timestamps();
            }
            $t->index('created_at');
            $t->index('grade_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            if (Schema::hasColumn('users','suspended_at')) $t->dropColumn('suspended_at');
            if (Schema::hasColumn('users','is_active')) $t->dropColumn('is_active');
            // indexها را لازم نیست حتماً حذف کنی مگر حساس باشی
        });
    }
};
