<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExamSupportSeeder extends Seeder
{
    public function run(): void
    {
        // create a sample header template with correct column names
        DB::table('header_templates')->updateOrInsert(
            ['id' => 1],
            [
                'name' => 'پیش‌فرض مدرسه',
                'template_header_html' => '<h2 style="text-align:center">آزمون علوم</h2><p>نام: ________  کلاس: ________ تاریخ: ________</p>',
                'template_footer_html' => '<p style="text-align:center;font-size:10px">پایان آزمون</p>',
            ]
        );

        // give user 3 (if exists) some tokens
        if (! DB::table('token_counters')->where('user_id', 3)->exists()) {
            DB::table('token_counters')->insert([
                'user_id'     => 3,
                'plan_id'     => null,
                'tokens_total'=> 200,
                'tokens_used' => 0,
                'valid_until' => now()->addMonths(12)->toDateString(),
            ]);
        }
    }
}