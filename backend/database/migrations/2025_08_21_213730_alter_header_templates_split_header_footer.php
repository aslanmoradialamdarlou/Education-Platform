<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('header_templates', function (Blueprint $t) {
            if (!Schema::hasColumn('header_templates','template_header_html')) {
                $t->text('template_header_html')->nullable()->after('name');
            }
            if (!Schema::hasColumn('header_templates','template_footer_html')) {
                $t->text('template_footer_html')->nullable()->after('template_header_html');
            }
            if (!Schema::hasColumn('header_templates','meta')) {
                $t->json('meta')->nullable()->after('template_footer_html');
            }
            // اگر ستون قدیمی دارید، دیتا را منتقل کنید (Optional)
            // بعداً می‌توانید ستون قدیمی template_html را حذف کنید.
        });
    }
    public function down(): void {
        Schema::table('header_templates', function (Blueprint $t) {
            if (Schema::hasColumn('header_templates','template_header_html')) $t->dropColumn('template_header_html');
            if (Schema::hasColumn('header_templates','template_footer_html')) $t->dropColumn('template_footer_html');
            if (Schema::hasColumn('header_templates','meta')) $t->dropColumn('meta');
        });
    }
};
