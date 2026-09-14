<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('content_types', function (Blueprint $t) {
            if (!Schema::hasColumn('content_types', 'slug')) {
                $t->string('slug', 50)->unique()->nullable()->after('name');
            }
        });

        // Backfill ساده برای انواع رایج
        // اگر نام‌ها فارسیند، دستی نگاشت کن
        DB::table('content_types')->where('name', 'like', '%video%')->orWhere('name', 'فیلم')->update(['slug' => 'video']);
        DB::table('content_types')->where('name', 'like', '%booklet%')->orWhere('name', 'جزوه')->update(['slug' => 'booklet']);
        DB::table('content_types')->where('name', 'like', '%sample%')->orWhere('name', 'نمونه سؤال')->update(['slug' => 'sample']);

        // هر چیزی که هنوز null است، از name اسلاگ بساز
        $types = DB::table('content_types')->whereNull('slug')->get();
        foreach ($types as $t) {
            $slug = \Illuminate\Support\Str::slug($t->name ?: 'type-'.$t->id);
            // یکتا
            $try = $slug; $i = 1;
            while (DB::table('content_types')->where('slug', $try)->exists()) {
                $try = $slug.'-'.$i++;
            }
            DB::table('content_types')->where('id', $t->id)->update(['slug' => $try]);
        }
    }

    public function down(): void
    {
        Schema::table('content_types', function (Blueprint $t) {
            if (Schema::hasColumn('content_types', 'slug')) {
                $t->dropUnique(['slug']);
                $t->dropColumn('slug');
            }
        });
    }
};
