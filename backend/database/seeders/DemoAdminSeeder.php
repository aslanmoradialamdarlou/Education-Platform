<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoAdminSeeder extends Seeder
{
    public function run(): void
    {
        // ساخت/به‌روزرسانی کاربر ادمین
        DB::table('users')->updateOrInsert(
            ['phone' => '09120000000'], // کلید یکتا برای پیدا کردن کاربر
            [
                'first_name'         => 'ادمین',
                'last_name'          => 'سیستم',
                'name'               => 'ادمین سیستم',         // 👈 ستون name
                'email'              => 'admin@example.test',
                'password'           => Hash::make('secret123'), // 👈 اگر Auth پیش‌فرض لاراول را هم می‌خواهی
                'password_hash'      => Hash::make('secret123'), // 👈 برای سناریوی OTP/Password سفارشی
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]
        );

        $userId      = DB::table('users')->where('phone','09120000000')->value('id');
        $adminRoleId = DB::table('roles')->where('slug','admin')->value('id');

        // اتصال نقش ادمین
        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $userId, 'role_id' => $adminRoleId],
            []
        );
    }
}
