<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Make user_id nullable and add phone column so OTPs can be issued for phones with no user yet
        if (! Schema::hasTable('otp_codes')) return;

        // Drop FK if exists (MySQL default fk name used by Laravel)
        try {
            DB::statement('ALTER TABLE otp_codes DROP FOREIGN KEY otp_codes_user_id_foreign');
        } catch (\Throwable $e) {
            // ignore if FK doesn't exist or DB driver differs
        }

        // Make user_id nullable (use raw statement for MySQL)
        try {
            DB::statement('ALTER TABLE otp_codes MODIFY user_id BIGINT UNSIGNED NULL');
        } catch (\Throwable $e) {
            // ignore if not supported; attempt Laravel change()
            try {
                Schema::table('otp_codes', function (Blueprint $t) {
                    $t->unsignedBigInteger('user_id')->nullable()->change();
                });
            } catch (\Throwable $e) {
                // give up silently; runtime code will guard
            }
        }

        // Re-add FK if users table exists
        if (Schema::hasTable('users')) {
            try {
                Schema::table('otp_codes', function (Blueprint $t) {
                    $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                });
            } catch (\Throwable $e) {
                // ignore
            }
        }

        // Add phone column
        if (! Schema::hasColumn('otp_codes', 'phone')) {
            Schema::table('otp_codes', function (Blueprint $t) {
                $t->string('phone', 20)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('otp_codes')) return;

        if (Schema::hasColumn('otp_codes', 'phone')) {
            Schema::table('otp_codes', function (Blueprint $t) {
                $t->dropColumn('phone');
            });
        }

        // revert user_id nullability - best effort
        try {
            DB::statement('ALTER TABLE otp_codes MODIFY user_id BIGINT UNSIGNED NOT NULL');
        } catch (\Throwable $e) {
            // ignore
        }
    }
};
