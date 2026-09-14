<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('subchapters', function (Blueprint $t) {
            $t->index('chapter_id'); // در کنار unique(chapter_id, number) مفید است
        });
    }
    public function down(): void
    {
        Schema::table('subchapters', function (Blueprint $t) {
            $t->dropIndex(['chapter_id']);
        });
    }
};
