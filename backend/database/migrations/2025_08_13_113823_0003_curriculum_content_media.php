<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // subjects
        Schema::create('subjects', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100)->unique();
        });

        // books
        Schema::create('books', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->unsignedBigInteger('grade_id');
            $t->foreign('grade_id')->references('id')->on('grades')->cascadeOnDelete();
            $t->string('title',150);
            $t->smallInteger('year');
            $t->timestampsTz();
            $t->unique(['subject_id','grade_id','year']);
        });

        // chapters
        Schema::create('chapters', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('book_id')->constrained()->cascadeOnDelete();
            $t->smallInteger('number');
            $t->string('title',150);
            $t->timestampsTz();
            $t->unique(['book_id','number']);
        });

        // subchapters
        Schema::create('subchapters', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $t->smallInteger('number');
            $t->string('title',150);
            $t->timestampsTz();
            $t->unique(['chapter_id','number']);
        });

        // content_types
        Schema::create('content_types', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',50)->unique();
        });

        // contents
        Schema::create('contents', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('type_id')->constrained('content_types')->cascadeOnDelete();
            $t->foreignId('subchapter_id')->nullable()->constrained()->nullOnDelete();
            $t->string('title',200);
            $t->text('description')->nullable();
            $t->boolean('is_free')->default(false);
            $t->timestampsTz();
        });

        // media_files
        Schema::create('media_files', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('owner_type',50);
            $t->unsignedBigInteger('owner_id');
            $t->string('kind',20); // pdf, video, image, ...
            $t->string('storage_path',500);
            $t->unsignedBigInteger('size')->nullable();
            $t->string('mime',100)->nullable();
            $t->json('meta')->nullable();
            $t->timestampsTz();
            $t->index(['owner_type','owner_id']);
        });

        // content_tags
        Schema::create('content_tags', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100);
            $t->string('slug',120)->unique();
        });

        // content_tag_pivot
        Schema::create('content_tag_pivot', function (Blueprint $t) {
            $t->foreignId('content_id')->constrained('contents')->cascadeOnDelete();
            $t->foreignId('tag_id')->constrained('content_tags')->cascadeOnDelete();
            $t->primary(['content_id','tag_id']);
        });

        // content_views
        Schema::create('content_views', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('content_id')->constrained()->cascadeOnDelete();
            $t->timestampTz('viewed_at')->nullable();
        });

        // video_licenses
        Schema::create('video_licenses', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('content_id')->constrained()->cascadeOnDelete();
            $t->date('start_date');
            $t->date('end_date');
            $t->enum('status', ['active','expired','revoked'])->nullable(); // 👈
            $t->json('meta')->nullable();
            $t->unique(['user_id','content_id']);
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('video_licenses');
        Schema::dropIfExists('content_views');
        Schema::dropIfExists('content_tag_pivot');
        Schema::dropIfExists('content_tags');
        Schema::dropIfExists('media_files');
        Schema::dropIfExists('contents');
        Schema::dropIfExists('content_types');
        Schema::dropIfExists('subchapters');
        Schema::dropIfExists('chapters');
        Schema::dropIfExists('books');
        Schema::dropIfExists('subjects');
    }
};
