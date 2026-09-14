<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DummyUsersSeeder extends Seeder
{
    public function run(): void
    {
        // we already have admin from DemoAdminSeeder
        // here we just add some normal users
        $existing = DB::table('users')->count();
        $target   = 20; // total users we want after seeding
        $toCreate = max(0, $target - $existing);

        for ($i = 1; $i <= $toCreate; $i++) {
            $email = "user{$i}@example.test";

            DB::table('users')->updateOrInsert(
                ['email' => $email],
                [
                    'first_name'        => 'کاربر',
                    'last_name'         => "شماره {$i}",
                    'name'              => "کاربر تست {$i}",
                    'email'             => $email,
                    'phone'             => '0912' . str_pad((string)$i, 7, '0', STR_PAD_LEFT),
                    'password'          => Hash::make('password'),
                    'password_hash'     => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_active'         => true,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]
            );
        }

        $this->command?->info('✓ Dummy users seeded.');
    }
}