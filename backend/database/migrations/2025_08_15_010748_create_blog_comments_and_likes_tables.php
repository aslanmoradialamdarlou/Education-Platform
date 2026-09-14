<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // نظرات اختصاصی وبلاگ
        Schema::create('blog_comments', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('post_id')->constrained('blog_posts')->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->text('body');
            $t->enum('status', ['pending','approved','rejected'])->default('approved');
            $t->timestampsTz();

            $t->index(['post_id', 'status']);
        });

        // لایک‌های اختصاصی وبلاگ
        Schema::create('blog_likes', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('post_id')->constrained('blog_posts')->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestampsTz();

            $t->unique(['post_id','user_id']); // هر کاربر فقط یک‌بار هر پست را لایک کند
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_likes');
        Schema::dropIfExists('blog_comments');
    }
};
