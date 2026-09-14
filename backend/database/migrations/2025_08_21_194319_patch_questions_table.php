<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('questions', function (Blueprint $t) {
            // مکان‌یابی سریع (nullable برای سناریوهایی که نداری)
            $t->foreignId('grade_id')->nullable()->after('type_id')->constrained('grades')->nullOnDelete();
            $t->foreignId('book_id')->nullable()->after('grade_id')->constrained('books')->nullOnDelete();
            $t->foreignId('chapter_id')->nullable()->after('book_id')->constrained('chapters')->nullOnDelete();
            // subchapter_id قبلاً داری (خوبه)

            // دسترسی و چرخه‌عمر
            $t->boolean('is_free')->default(false)->after('subchapter_id');
            $t->enum('status', ['draft','reviewed','published','archived'])->default('draft')->after('is_free');

            // توضیح تشریحی + متای آزاد
            $t->longText('explanation')->nullable()->after('answer_text');
            $t->json('meta')->nullable()->after('explanation');

            // نویسنده/ویراستار
            $t->foreignId('author_id')->nullable()->after('meta')->constrained('users')->nullOnDelete();

            // ایندکس‌ها
            $t->index(['grade_id','book_id']);
            $t->index(['chapter_id','subchapter_id']);
            $t->index(['type_id','difficulty']);
            $t->index(['status','is_free']);
            $t->index('book_page');
            $t->softDeletesTz();
        });
    }

    public function down(): void {
        Schema::table('questions', function (Blueprint $t) {
            $t->dropSoftDeletes();
            $t->dropConstrainedForeignId('author_id');
            $t->dropColumn(['meta','explanation','status','is_free']);
            $t->dropConstrainedForeignId('chapter_id');
            $t->dropConstrainedForeignId('book_id');
            $t->dropConstrainedForeignId('grade_id');
        });
    }
};
