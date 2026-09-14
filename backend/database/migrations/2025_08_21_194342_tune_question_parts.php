<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('question_options', function (Blueprint $t) {
            // هر گزینه در یک سؤال یک label یکتا داشته باشد (اگر label می‌دهی)
            $t->index('question_id');
            $t->unique(['question_id','label']);
        });

        Schema::table('question_pairs', function (Blueprint $t) {
            $t->index('question_id');
        });

        Schema::table('question_blanks', function (Blueprint $t) {
            $t->index('question_id');
            $t->unique(['question_id','blank_index']);
        });

        Schema::table('question_tag_pivot', function (Blueprint $t) {
            $t->index('tag_id');
        });
    }

    public function down(): void {
        Schema::table('question_options', function (Blueprint $t) {
            $t->dropUnique(['question_id','label']);
            $t->dropIndex(['question_id']);
        });
        Schema::table('question_pairs', function (Blueprint $t) {
            $t->dropIndex(['question_id']);
        });
        Schema::table('question_blanks', function (Blueprint $t) {
            $t->dropUnique(['question_id','blank_index']);
            $t->dropIndex(['question_id']);
        });
        Schema::table('question_tag_pivot', function (Blueprint $t) {
            $t->dropIndex(['tag_id']);
        });
    }
};
