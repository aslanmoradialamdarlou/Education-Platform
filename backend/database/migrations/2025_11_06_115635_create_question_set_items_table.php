<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('question_set_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_set_id')->constrained('user_question_sets')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamp('created_at')->useCurrent();
            
            $table->unique(['question_set_id', 'question_id']);
            $table->index('question_set_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_set_items');
    }
};
