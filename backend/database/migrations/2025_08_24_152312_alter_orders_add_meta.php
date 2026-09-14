<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $t) {
            // اگر ستون وجود ندارد اضافه کن
            if (!Schema::hasColumn('orders', 'meta')) {
                $t->json('meta')->nullable()->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $t) {
            if (Schema::hasColumn('orders', 'meta')) {
                $t->dropColumn('meta');
            }
        });
    }
};
