<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('token_counters', function (Blueprint $t) {
            $t->index(['user_id','valid_until']);
        });
        Schema::table('token_usages', function (Blueprint $t) {
            $t->index(['user_id','used_at']);
        });
    }
    public function down(): void {
        Schema::table('token_counters', function (Blueprint $t) {
            $t->dropIndex(['user_id','valid_until']);
        });
        Schema::table('token_usages', function (Blueprint $t) {
            $t->dropIndex(['user_id','used_at']);
        });
    }
};
