<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('video_licenses', function (Blueprint $t) {
            // اگر قبلاً start_date/end_date دارید، nullable کنید
            if (Schema::hasColumn('video_licenses', 'start_date')) {
                $t->timestamp('start_date')->nullable()->change();
            }
            if (Schema::hasColumn('video_licenses', 'end_date')) {
                $t->timestamp('end_date')->nullable()->change();
            }

            // اگر enum محدود دارید، safe نیست change روی enum; ولی اگر enum شما اجازه می‌دهد:
            // مطمئن شو 'pending' هم داخل enum هست. اگر نبود، موقتاً به string تبدیل کن.
            // برای سادگی، اگر enum مشکل دارد حذف و دوباره بساز (در محیط dev):
            // توجه: اگر prod هست، محتاط باش.
            // این قطعه فقط زمانی اجرا کن که enumت مشکل ایجاد کرده:
            // DB::statement("ALTER TABLE video_licenses MODIFY COLUMN status ENUM('pending','active','expired','revoked','failed') NOT NULL DEFAULT 'pending'");
        });
    }

    public function down(): void
    {
        // بازگشتی لازم نیست
    }
};
