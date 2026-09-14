<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('blog_posts', function (Blueprint $t) {
            $t->string('excerpt', 300)->nullable()->after('content');
            $t->string('cover_image_url', 500)->nullable()->after('excerpt');
            $t->string('meta_title', 255)->nullable()->after('cover_image_url');
            $t->string('meta_description', 300)->nullable()->after('meta_title');
            $t->json('meta_keywords')->nullable()->after('meta_description');
            $t->string('canonical_url', 500)->nullable()->after('meta_keywords');
            $t->unsignedInteger('reading_time')->default(0)->after('canonical_url');
            $t->boolean('is_pinned')->default(false)->after('reading_time');
        });
    }

    public function down(): void {
        Schema::table('blog_posts', function (Blueprint $t) {
            $t->dropColumn([
                'excerpt','cover_image_url','meta_title','meta_description',
                'meta_keywords','canonical_url','reading_time','is_pinned'
            ]);
        });
    }
};
