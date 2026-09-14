<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('header_templates', function (Blueprint $t) {
            if (!Schema::hasColumn('header_templates','created_at')
                && !Schema::hasColumn('header_templates','updated_at')) {
                // اگر منطقه زمانی می‌خواهی، از timestampsTz استفاده کن
                $t->timestamps(); // یا: $t->timestampsTz();
            }
        });
    }

    public function down(): void
    {
        Schema::table('header_templates', function (Blueprint $t) {
            if (Schema::hasColumn('header_templates','created_at')) $t->dropColumn('created_at');
            if (Schema::hasColumn('header_templates','updated_at')) $t->dropColumn('updated_at');
        });
    }
};
