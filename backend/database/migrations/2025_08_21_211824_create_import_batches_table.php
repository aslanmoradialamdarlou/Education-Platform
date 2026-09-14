<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('import_batches', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('type',50);               // 'questions'
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('source_path',500);       // storage path
            $t->integer('total_rows')->default(0);
            $t->integer('processed_rows')->default(0);
            $t->integer('success_rows')->default(0);
            $t->integer('failed_rows')->default(0);
            $t->json('errors')->nullable();      // آرایه‌ای از خطاهای هر ردیف
            $t->enum('status',['queued','processing','done','failed'])->default('queued');
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('import_batches');
    }
};
