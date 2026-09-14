<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('import_batches', function (Blueprint $t) {
            // ستون‌های اصلی شمارش و وضعیت (اگر در جدول اولیه نبودند)
            if (!Schema::hasColumn('import_batches', 'status')) {
                $t->string('status', 30)->default('queued');
            }
            if (!Schema::hasColumn('import_batches', 'total_rows')) {
                $t->unsignedInteger('total_rows')->default(0);
            }
            if (!Schema::hasColumn('import_batches', 'rows_processed')) {
                $t->unsignedInteger('rows_processed')->default(0);
            }
            if (!Schema::hasColumn('import_batches', 'errors_count')) {
                $t->unsignedInteger('errors_count')->default(0);
            }

            // متادیتای فایل
            if (!Schema::hasColumn('import_batches', 'original_name')) {
                $t->string('original_name', 255)->nullable();
            }
            if (!Schema::hasColumn('import_batches', 'mime_type')) {
                $t->string('mime_type', 100)->nullable();
            }

            // JSON meta (بدون after تا به ستون‌های دیگر وابسته نشود)
            if (!Schema::hasColumn('import_batches', 'meta')) {
                $t->json('meta')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('import_batches', function (Blueprint $t) {
            if (Schema::hasColumn('import_batches', 'original_name')) $t->dropColumn('original_name');
            if (Schema::hasColumn('import_batches', 'mime_type'))     $t->dropColumn('mime_type');
            if (Schema::hasColumn('import_batches', 'meta'))          $t->dropColumn('meta');
            // ستون‌های عددی و status را معمولاً نگه می‌داریم (اگر لازم است، این‌ها را هم drop کن)
            // if (Schema::hasColumn('import_batches', 'status')) $t->dropColumn('status');
            // if (Schema::hasColumn('import_batches', 'total_rows')) $t->dropColumn('total_rows');
            // if (Schema::hasColumn('import_batches', 'rows_processed')) $t->dropColumn('rows_processed');
            // if (Schema::hasColumn('import_batches', 'errors_count')) $t->dropColumn('errors_count');
        });
    }
};
