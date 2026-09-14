<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('blog_categories', function (Blueprint $t) {
            if (!Schema::hasColumn('blog_categories', 'created_at')) {
                $t->timestamp('created_at')->nullable()->after('slug');
            }
            if (!Schema::hasColumn('blog_categories', 'updated_at')) {
                $t->timestamp('updated_at')->nullable()->after('created_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('blog_categories', function (Blueprint $t) {
            if (Schema::hasColumn('blog_categories', 'updated_at')) {
                $t->dropColumn('updated_at');
            }
            if (Schema::hasColumn('blog_categories', 'created_at')) {
                $t->dropColumn('created_at');
            }
        });
    }
};
