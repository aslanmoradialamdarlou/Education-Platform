<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('blog_tags', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name', 100);
            $t->string('slug', 120)->unique();
            $t->timestampsTz();
        });

        Schema::create('blog_post_tag', function (Blueprint $t) {
            $t->foreignId('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $t->foreignId('blog_tag_id')->constrained('blog_tags')->cascadeOnDelete();
            $t->primary(['blog_post_id','blog_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_tag');
        Schema::dropIfExists('blog_tags');
    }
};
