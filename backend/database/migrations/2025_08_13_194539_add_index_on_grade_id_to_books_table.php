<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** نام ایندکس را ثابت نگه می‌داریم تا drop راحت باشد */
    private string $indexName = 'books_grade_id_index';

    /** بررسی وجود ایندکس (MySQL) بدون Doctrine */
    private function indexExists(string $table, string $index): bool
    {
        $row = DB::selectOne("
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name   = ?
              AND index_name   = ?
            LIMIT 1
        ", [$table, $index]);

        return (bool) $row;
    }

    public function up(): void
    {
        if (! Schema::hasColumn('books', 'grade_id')) {
            return;
        }

        if (! $this->indexExists('books', $this->indexName)) {
            Schema::table('books', function (Blueprint $table) {
                $table->index('grade_id', $this->indexName);
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('books', $this->indexName)) {
            Schema::table('books', function (Blueprint $table) {
                $table->dropIndex($this->indexName);
            });
        }
    }
};
