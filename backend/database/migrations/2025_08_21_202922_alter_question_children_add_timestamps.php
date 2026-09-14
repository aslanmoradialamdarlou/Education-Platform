<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ✅ اگر ستون‌ها وجود ندارند، timestamps اضافه کن (nullable هست و مشکلی در داده‌های قدیمی ایجاد نمی‌کند)
        if (!Schema::hasColumn('question_pairs', 'created_at') && !Schema::hasColumn('question_pairs', 'updated_at')) {
            Schema::table('question_pairs', function (Blueprint $t) {
                $t->timestamps();
            });
        }

        if (!Schema::hasColumn('question_options', 'created_at') && !Schema::hasColumn('question_options', 'updated_at')) {
            Schema::table('question_options', function (Blueprint $t) {
                $t->timestamps();
            });
        }

        if (!Schema::hasColumn('question_blanks', 'created_at') && !Schema::hasColumn('question_blanks', 'updated_at')) {
            Schema::table('question_blanks', function (Blueprint $t) {
                $t->timestamps();
            });
        }
    }

    public function down(): void
    {
        // اختیاری: حذفشان در down (معمولاً لازم نیست)
        if (Schema::hasColumn('question_pairs', 'created_at')) {
            Schema::table('question_pairs', function (Blueprint $t) {
                $t->dropColumn(['created_at','updated_at']);
            });
        }
        if (Schema::hasColumn('question_options', 'created_at')) {
            Schema::table('question_options', function (Blueprint $t) {
                $t->dropColumn(['created_at','updated_at']);
            });
        }
        if (Schema::hasColumn('question_blanks', 'created_at')) {
            Schema::table('question_blanks', function (Blueprint $t) {
                $t->dropColumn(['created_at','updated_at']);
            });
        }
    }
};
