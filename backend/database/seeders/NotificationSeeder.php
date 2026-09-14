<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $users = DB::table('users')->pluck('id')->all();
        if (empty($users)) {
            $this->command?->warn('No users for NotificationSeeder.');
            return;
        }

        // your table allows only ONE row per user (unique user_id)
        foreach ($users as $uid) {
            DB::table('notification_preferences')->updateOrInsert(
                ['user_id' => $uid],
                [
                    'channel'     => 'email', // must be one of: email, sms, push
                    'enabled'     => true,
                    'quiet_hours' => null,
                ]
            );
        }

        // create some notifications
        foreach (range(1, 30) as $i) {
            $uid = $users[array_rand($users)];
            DB::table('notifications')->insert([
                'user_id'    => $uid,
                'type'       => 'system',
                'title'      => 'اعلان شماره ' . $i,
                'body'       => 'این یک اعلان تستی است.',
                'data'       => json_encode(['demo' => true]),
                'read_at'    => rand(0, 1) ? now() : null,
                'created_at' => now()->subHours(rand(1, 200)),
            ]);
        }

        $this->command?->info('✓ Notifications and preferences seeded.');
    }
}