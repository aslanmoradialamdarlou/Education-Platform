<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('blog_post_revisions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('post_id')->constrained('blog_posts')->cascadeOnDelete();
            $t->foreignId('editor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('title', 200)->nullable();
            $t->text('content')->nullable();
            $t->json('meta')->nullable(); // مثلا SEO قبلی
            $t->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_revisions');
    }
};
