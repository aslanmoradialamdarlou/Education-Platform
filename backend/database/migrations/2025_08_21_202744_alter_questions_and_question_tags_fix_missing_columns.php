<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ✅ questions: افزودن ستون‌های status و is_free اگر نبود
        Schema::table('questions', function (Blueprint $t) {
            if (! Schema::hasColumn('questions', 'status')) {
                // draft | published | archived
                $t->enum('status', ['draft','published','archived'])->default('draft')->after('answer_text');
            }
            if (! Schema::hasColumn('questions', 'is_free')) {
                $t->boolean('is_free')->default(false)->after('status');
            }
        });

        // ✅ question_tags: افزودن timestamps اگر نبود
        Schema::table('question_tags', function (Blueprint $t) {
            if (! Schema::hasColumn('question_tags', 'created_at')
                && ! Schema::hasColumn('question_tags', 'updated_at')) {
                $t->timestamps(); // created_at / updated_at
            }
        });
    }

    public function down(): void
    {
        // به‌صورت امن حذف نکنیم (اختیاری). اگر خواستی، می‌توانی حذف کنی:
        Schema::table('questions', function (Blueprint $t) {
            if (Schema::hasColumn('questions', 'is_free'))  { $t->dropColumn('is_free'); }
            if (Schema::hasColumn('questions', 'status'))   { $t->dropColumn('status'); }
        });

        Schema::table('question_tags', function (Blueprint $t) {
            if (Schema::hasColumn('question_tags', 'created_at')) { $t->dropColumn('created_at'); }
            if (Schema::hasColumn('question_tags', 'updated_at')) { $t->dropColumn('updated_at'); }
        });
    }
};
