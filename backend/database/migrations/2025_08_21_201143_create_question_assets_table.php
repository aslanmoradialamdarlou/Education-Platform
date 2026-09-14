<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('question_assets', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $t->string('type',20)->nullable(); // image|pdf|audio|video
            $t->string('file_path',500);
            $t->string('file_url',500)->nullable();
            $t->json('meta')->nullable();
            $t->timestampsTz();
            $t->index(['question_id','type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_assets');
    }
};
