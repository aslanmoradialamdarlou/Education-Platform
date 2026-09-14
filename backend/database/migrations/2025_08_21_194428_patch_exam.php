<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('exams', function (Blueprint $t) {
            $t->json('settings')->nullable()->after('header_template_id'); // چیدمان، فونت، نمایش پاسخ‌ها...
            $t->enum('status', ['draft','finalized'])->default('draft')->after('settings');
            $t->decimal('total_points',6,2)->default(0)->after('status');
            $t->unsignedInteger('token_cost')->default(0)->after('total_points'); // هزینه تولید PDF
        });

        Schema::table('exam_questions', function (Blueprint $t) {
            $t->index(['exam_id','order_number']);
        });

        Schema::table('exam_exports', function (Blueprint $t) {
            $t->string('variant',50)->nullable()->after('file_url'); // سوال/پاسخ/کلید
        });
    }

    public function down(): void {
        Schema::table('exam_exports', function (Blueprint $t) {
            $t->dropColumn('variant');
        });
        Schema::table('exam_questions', function (Blueprint $t) {
            $t->dropIndex(['exam_id','order_number']);
        });
        Schema::table('exams', function (Blueprint $t) {
            $t->dropColumn(['settings','status','total_points','token_cost']);
        });
    }
};
