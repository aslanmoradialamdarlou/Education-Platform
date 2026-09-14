<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('question_types', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',50)->unique();
        });

        Schema::create('questions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('type_id')->constrained('question_types')->cascadeOnDelete();
            $t->foreignId('subchapter_id')->constrained()->cascadeOnDelete();
            $t->enum('difficulty', ['easy','medium','hard'])->nullable(); // 👈
            $t->string('source',150)->nullable();
            $t->smallInteger('book_page')->nullable();
            $t->text('question_text');
            $t->text('answer_text')->nullable();
            $t->timestampsTz();
        });

        Schema::create('question_options', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $t->string('label',10)->nullable();
            $t->text('text');
            $t->boolean('is_correct')->default(false);
        });

        Schema::create('question_pairs', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $t->text('left_text');
            $t->text('right_text');
            $t->string('match_key',50)->nullable();
        });

        Schema::create('question_blanks', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $t->smallInteger('blank_index');
            $t->string('correct_text',255);
        });

        Schema::create('question_tags', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100);
            $t->string('slug',120)->unique();
        });

        Schema::create('question_tag_pivot', function (Blueprint $t) {
            $t->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $t->foreignId('tag_id')->constrained('question_tags')->cascadeOnDelete();
            $t->primary(['question_id','tag_id']);
        });

        Schema::create('header_templates', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100);
            $t->text('template_html');
        });

        Schema::create('exams', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('title',200);
            $t->foreignId('header_template_id')->nullable()->constrained('header_templates')->nullOnDelete();
            $t->timestampsTz();
        });

        Schema::create('exam_questions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $t->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $t->smallInteger('order_number')->nullable();
            $t->decimal('points',5,2)->nullable();
            $t->unique(['exam_id','question_id']);
        });

        Schema::create('exam_exports', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $t->string('file_url',500);
            $t->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_exports');
        Schema::dropIfExists('exam_questions');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('header_templates');
        Schema::dropIfExists('question_tag_pivot');
        Schema::dropIfExists('question_tags');
        Schema::dropIfExists('question_blanks');
        Schema::dropIfExists('question_pairs');
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('question_types');
    }
};
