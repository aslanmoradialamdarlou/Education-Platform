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
        // Update existing rows with proper slugs
        DB::table('content_types')->where('id', 1)->update(['slug' => 'sample']);
        DB::table('content_types')->where('id', 2)->update(['slug' => 'booklet']);
        DB::table('content_types')->where('id', 3)->update(['slug' => 'video']);
        DB::table('content_types')->where('id', 4)->update(['slug' => 'experiment']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set slugs back to null if rolling back
        DB::table('content_types')->whereIn('id', [1, 2, 3, 4])->update(['slug' => null]);
    }
};
