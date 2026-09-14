<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('header_templates', function (Blueprint $t) {
            // ستون‌های جدید اگر وجود ندارند اضافه شوند
            if (!Schema::hasColumn('header_templates', 'template_header_html')) {
                $t->longText('template_header_html')->nullable();
            }
            if (!Schema::hasColumn('header_templates', 'template_footer_html')) {
                $t->longText('template_footer_html')->nullable();
            }
            if (!Schema::hasColumn('header_templates', 'meta')) {
                $t->json('meta')->nullable();
            }
            // اگر timestamps نداریم، اضافه کنیم
            if (!Schema::hasColumn('header_templates', 'created_at')) {
                $t->timestamps(); // created_at, updated_at
            }
        });

        // اگر ستون قدیمی template_html داریم، داده‌اش را به header منتقل کن
        if (Schema::hasColumn('header_templates', 'template_html')) {
            // هرچه در template_html بوده به template_header_html کپی شود (برای حفظ داده)
            DB::statement("
                UPDATE header_templates
                SET template_header_html = COALESCE(template_header_html, template_html)
            ");

            // حالا ستون قدیمی را حذف کن
            Schema::table('header_templates', function (Blueprint $t) {
                $t->dropColumn('template_html');
            });
        }
    }

    public function down(): void
    {
        // در صورت برگشت، ستون قدیمی را برمی‌گردانیم و مقادیر را از header کپی می‌کنیم
        Schema::table('header_templates', function (Blueprint $t) {
            if (!Schema::hasColumn('header_templates', 'template_html')) {
                $t->longText('template_html')->nullable();
            }
        });

        // کپی برعکس (اگر header پر است)
        DB::statement("
            UPDATE header_templates
            SET template_html = COALESCE(template_html, template_header_html)
        ");

        Schema::table('header_templates', function (Blueprint $t) {
            if (Schema::hasColumn('header_templates', 'template_header_html')) {
                $t->dropColumn('template_header_html');
            }
            if (Schema::hasColumn('header_templates', 'template_footer_html')) {
                $t->dropColumn('template_footer_html');
            }
            if (Schema::hasColumn('header_templates', 'meta')) {
                $t->dropColumn('meta');
            }
            // timestamps را عمدتاً نگه می‌داریم؛ اگر خواستی می‌توانی اینجا drop کنی
        });
    }
};
