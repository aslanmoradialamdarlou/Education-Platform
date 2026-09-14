<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('contents', function (Blueprint $t) {
            $t->index('subchapter_id');
            $t->index('type_id');
            $t->index('is_free');
            $t->index(['subchapter_id','type_id','is_free'], 'contents_sub_type_free_idx');
            // اگر جستجو زیاد دارید:
            // $t->index('title');  // و اگر MySQL 8: FULLTEXT(title, description)
        });
    }

    public function down(): void
    {
        Schema::table('contents', function (Blueprint $t) {
            $t->dropIndex(['subchapter_id']);
            $t->dropIndex(['type_id']);
            $t->dropIndex(['is_free']);
            $t->dropIndex('contents_sub_type_free_idx');
        });
    }
};
