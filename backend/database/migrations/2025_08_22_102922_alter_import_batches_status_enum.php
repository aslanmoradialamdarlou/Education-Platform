<?php

// database/migrations/2025_08_22_000001_alter_import_batches_status_enum.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // مقادیر مجاز: queued, processing, finished, failed
        DB::statement("
            ALTER TABLE import_batches
            MODIFY COLUMN status
            ENUM('queued','processing','finished','failed')
            NOT NULL DEFAULT 'queued'
        ");
    }

    public function down(): void
    {
        // اگر قبلاً مثلا finished نبود، برگردون به حالت قبل (نمونه)
        DB::statement("
            ALTER TABLE import_batches
            MODIFY COLUMN status
            ENUM('queued','processing','failed')
            NOT NULL DEFAULT 'queued'
        ");
    }
};
