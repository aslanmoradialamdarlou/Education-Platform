<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Change is_free column default to true
            $table->boolean('is_free')->default(true)->change();
        });
        
        // Update existing questions to be free if not already set
        DB::table('questions')->where('is_free', false)->update(['is_free' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Revert to previous default (false)
            $table->boolean('is_free')->default(false)->change();
        });
    }
};
