<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $t) {
            // ستون‌ها
            if (!Schema::hasColumn('questions', 'status')) {
                $t->enum('status', ['draft','published','archived'])->default('draft')->after('answer_text');
            }
            if (!Schema::hasColumn('questions', 'is_free')) {
                $t->boolean('is_free')->default(false)->after('status');
            }

            // ایندکس‌ها (با نام‌دهی صریح)
            if (! $this->hasIndex('questions', 'questions_subchapter_id_index')) {
                $t->index('subchapter_id', 'questions_subchapter_id_index');
            }
            if (! $this->hasIndex('questions', 'questions_type_id_index')) {
                $t->index('type_id', 'questions_type_id_index');
            }
            if (! $this->hasIndex('questions', 'questions_difficulty_index')) {
                $t->index('difficulty', 'questions_difficulty_index');
            }
            if (! $this->hasIndex('questions', 'questions_is_free_index')) {
                $t->index('is_free', 'questions_is_free_index');
            }
            if (! $this->hasIndex('questions', 'questions_status_index')) {
                $t->index('status', 'questions_status_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $t) {
            // ستون‌ها را می‌توان حذف کرد (اگر می‌خواهی)
            if (Schema::hasColumn('questions', 'status'))  $t->dropColumn('status');
            if (Schema::hasColumn('questions', 'is_free')) $t->dropColumn('is_free');

            // ⚠️ ایندکس subchapter_id را حذف نکن (FK به آن نیاز دارد)
            // فقط ایندکس‌هایی که خودت اضافه کرده‌ای و به FK وابسته نیستند را حذف کن:

            $this->dropIndexIfExists('questions', 'questions_type_id_index', $t);
            $this->dropIndexIfExists('questions', 'questions_difficulty_index', $t);
            $this->dropIndexIfExists('questions', 'questions_is_free_index', $t);
            $this->dropIndexIfExists('questions', 'questions_status_index', $t);
        });
    }

    private function dropIndexIfExists(string $table, string $index, Blueprint $t): void
    {
        $db = DB::getDatabaseName();
        $exists = DB::table('information_schema.statistics')
            ->where('table_schema', $db)
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();

        if ($exists) {
            try { $t->dropIndex($index); } catch (\Throwable $e) {
                // در صورت وابستگی یا نبودن، بی‌سر و صدا عبور کن
            }
        }
    }

    /** بدون Doctrine: از information_schema می‌خوانیم */
    private function hasIndex(string $table, string $index): bool
    {
        $db = DB::getDatabaseName();
        return DB::table('information_schema.statistics')
            ->where('table_schema', $db)
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }
};
