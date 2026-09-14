<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();

            // General / branding
            $table->string('site_name')->nullable();            // "المنیو"
            $table->string('logo_path')->nullable();            // store file path or URL

            // Support info
            $table->string('support_email')->nullable();        // support@example.com
            $table->string('support_phone', 32)->nullable();    // 021-12345678

            // Modes
            $table->boolean('is_repair_mode')->default(false);  // حالت تعمیرات (true/false)
            $table->boolean('is_maintenance_mode')->default(false); // Maintenance Mode toggle

            // Economy / wallet
            $table->unsignedInteger('initial_tokens_for_new_user')->default(0); // توکن اولیه کاربر جدید
            $table->unsignedBigInteger('min_wallet_deposit')->default(0);       // حداقل واریز کیف پول (تومان)

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};