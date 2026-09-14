<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('question_imports', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('file_path', 500);
            $t->enum('status', ['queued','processing','completed','failed'])->default('queued');
            $t->integer('total_rows')->nullable();
            $t->integer('processed_rows')->default(0);
            $t->integer('success_count')->default(0);
            $t->integer('error_count')->default(0);
            $t->longText('errors_json')->nullable(); // آرایه‌ای از خطاهای ردیف‌ها
            $t->timestamp('started_at')->nullable();
            $t->timestamp('finished_at')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('question_imports');
    }
};
