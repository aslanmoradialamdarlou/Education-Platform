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
        Schema::table('contents', function (Blueprint $table) {
            $table->unsignedInteger('view_count')->default(0)->after('is_free');
            $table->unsignedInteger('download_count')->default(0)->after('view_count');
            $table->unsignedInteger('pages')->default(0)->after('download_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contents', function (Blueprint $table) {
            $table->dropColumn(['view_count', 'download_count', 'pages']);
        });
    }
};
