<?php

// database/migrations/2025_08_24_999999_add_timestamps_to_subscriptions.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $t) {
            $t->timestamp('created_at')->nullable()->after('status');
            $t->timestamp('updated_at')->nullable()->after('created_at');
        });

        // مقداردهی اولیه: created_at = start_date، updated_at = NOW()
        DB::table('subscriptions')->update([
            'created_at' => DB::raw('COALESCE(start_date, NOW())'),
            'updated_at' => DB::raw('NOW()'),
        ]);
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $t) {
            $t->dropColumn(['created_at','updated_at']);
        });
    }
};
