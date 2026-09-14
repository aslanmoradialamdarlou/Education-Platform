<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('plan_access', function (Blueprint $t) {
            $t->foreignId('grade_id')->nullable()->after('plan_id')->constrained('grades')->nullOnDelete();
            $t->foreignId('subchapter_id')->nullable()->after('chapter_id')->constrained('subchapters')->nullOnDelete();

            // برای کوئری سریع
            $t->index(['plan_id','grade_id']);
            $t->index(['plan_id','book_id']);
            $t->index(['plan_id','chapter_id']);
            $t->index(['plan_id','subchapter_id']);
        });
    }
    public function down(): void {
        Schema::table('plan_access', function (Blueprint $t) {
            $t->dropIndex(['plan_id','grade_id']);
            $t->dropIndex(['plan_id','book_id']);
            $t->dropIndex(['plan_id','chapter_id']);
            $t->dropIndex(['plan_id','subchapter_id']);
            $t->dropConstrainedForeignId('subchapter_id');
            $t->dropConstrainedForeignId('grade_id');
        });
    }
};
