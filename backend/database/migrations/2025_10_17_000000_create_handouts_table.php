<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('handouts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('pdf_url')->nullable();
            $table->integer('pages')->nullable();
            $table->unsignedBigInteger('price')->default(0);
            $table->string('teacher')->nullable();
            $table->string('grade')->nullable();
            $table->string('subject')->nullable();
            $table->string('chapter')->nullable();
            $table->string('access_type')->default('paid');
            $table->string('status')->default('draft');
            $table->boolean('access_revoked')->default(false);
            $table->string('teacher_guide_url')->nullable();
            $table->string('class_summary_url')->nullable();
            $table->timestamp('added_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('handouts');
    }
};
