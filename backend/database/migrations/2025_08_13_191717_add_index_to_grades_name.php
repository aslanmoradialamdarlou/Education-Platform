<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $t) {
            if (! $this->hasIndex('grades', 'grades_name_index')) {
                $t->index('name'); // نام پیش‌فرض همینه: grades_name_index
            }
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $t) {
            // اگر ایندکس وجود داشت حذفش کن (dropIndex با نام ایندکس)
            if ($this->hasIndex('grades', 'grades_name_index')) {
                $t->dropIndex('grades_name_index');
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        // MySQL-compatible: SHOW INDEX
        $rows = DB::select("SHOW INDEX FROM `{$table}`");
        return collect($rows)->pluck('Key_name')->contains($index);
    }
};
