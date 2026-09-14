<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop foreign keys first
        DB::statement('ALTER TABLE books DROP FOREIGN KEY books_subject_id_foreign');
        DB::statement('ALTER TABLE books DROP FOREIGN KEY books_grade_id_foreign');

        // Then drop the unique index
        DB::statement('ALTER TABLE books DROP INDEX books_subject_id_grade_id_year_unique');

        // Optionally, recreate foreign keys without the unique constraint
        DB::statement('ALTER TABLE books 
            ADD CONSTRAINT books_subject_id_foreign FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE books 
            ADD CONSTRAINT books_grade_id_foreign FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE');
    }

    public function down(): void
    {
        // Drop foreign keys again
        DB::statement('ALTER TABLE books DROP FOREIGN KEY books_subject_id_foreign');
        DB::statement('ALTER TABLE books DROP FOREIGN KEY books_grade_id_foreign');

        // Restore the unique index
        Schema::table('books', function (Blueprint $table) {
            $table->unique(['subject_id', 'grade_id', 'year'], 'books_subject_id_grade_id_year_unique');
        });

        // Restore foreign keys
        DB::statement('ALTER TABLE books 
            ADD CONSTRAINT books_subject_id_foreign FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE books 
            ADD CONSTRAINT books_grade_id_foreign FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE');
    }
};
