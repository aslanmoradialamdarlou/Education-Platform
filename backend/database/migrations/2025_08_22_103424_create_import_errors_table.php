<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('import_errors', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('batch_id')->constrained('import_batches')->cascadeOnDelete();
            $t->unsignedInteger('row_no')->nullable();
            $t->string('message', 500);
            $t->json('payload')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('import_errors');
    }
};
