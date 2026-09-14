<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // —— permissions.slug را nullable کن و unique روی slug را حذف کن (اگر هست)
        if (Schema::hasColumn('permissions', 'slug')) {
            // حذف ایندکس یونیک روی slug اگر وجود دارد
            try { DB::statement('ALTER TABLE permissions DROP INDEX permissions_slug_unique'); } catch (\Throwable $e) {}
            try { DB::statement('ALTER TABLE permissions DROP INDEX slug'); } catch (\Throwable $e) {}
            // nullable کردن ستون slug (بدون نیاز به doctrine/dbal)
            try { DB::statement('ALTER TABLE permissions MODIFY slug varchar(191) NULL'); } catch (\Throwable $e) {}
        }

        // —— roles.slug را nullable کن و unique روی slug را حذف کن (اگر هست)
        if (Schema::hasColumn('roles', 'slug')) {
            try { DB::statement('ALTER TABLE roles DROP INDEX roles_slug_unique'); } catch (\Throwable $e) {}
            try { DB::statement('ALTER TABLE roles DROP INDEX slug'); } catch (\Throwable $e) {}
            try { DB::statement('ALTER TABLE roles MODIFY slug varchar(191) NULL'); } catch (\Throwable $e) {}
        }

        // تضمین یونیک کامپوزیت مطابق Spatie (name, guard_name)
        try { DB::statement('ALTER TABLE permissions ADD UNIQUE permissions_name_guard_unique (name, guard_name)'); } catch (\Throwable $e) {}
        try { DB::statement('ALTER TABLE roles ADD UNIQUE roles_name_guard_unique (name, guard_name)'); } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        // برگرداندن دقیق حالت قبلی لازمه نداره؛ فقط ایندکس‌های کامپوزیت را برمی‌داریم.
        try { DB::statement('ALTER TABLE permissions DROP INDEX permissions_name_guard_unique'); } catch (\Throwable $e) {}
        try { DB::statement('ALTER TABLE roles DROP INDEX roles_name_guard_unique'); } catch (\Throwable $e) {}
        // اگر واقعاً خواستی به حالت قبلی برگردی، خودت ایندکس‌های قبلی را بساز (اختیاری).
    }
};
