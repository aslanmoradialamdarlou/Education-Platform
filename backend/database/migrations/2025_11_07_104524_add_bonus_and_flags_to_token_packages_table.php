<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('token_packages', function (Blueprint $table) {
            $table->unsignedInteger('bonus')->default(0)->after('price')->comment('Extra bonus tokens');
            $table->boolean('popular')->default(false)->after('bonus')->comment('Mark as popular package');
            $table->boolean('best_value')->default(false)->after('popular')->comment('Mark as best value package');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('token_packages', function (Blueprint $table) {
            $table->dropColumn(['bonus', 'popular', 'best_value']);
        });
    }
};
