<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ContentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['نمونه‌سؤال','جزوه','فیلم','آزمایش'];
        foreach ($types as $t) {
            DB::table('content_types')->updateOrInsert(['name'=>$t], ['name'=>$t]);
        }
    }
}
