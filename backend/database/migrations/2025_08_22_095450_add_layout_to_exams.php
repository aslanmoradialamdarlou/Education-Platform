<?php

// database/migrations/2025_08_22_000001_add_layout_to_exams.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('exams', function (Blueprint $t) {
            if (!Schema::hasColumn('exams', 'layout')) {
                $t->json('layout')->nullable();
            }
        });
    }
    public function down(): void {
        Schema::table('exams', function (Blueprint $t) {
            if (Schema::hasColumn('exams', 'layout')) {
                $t->dropColumn('layout');
            }
        });
    }
};
