<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupportSeeder extends Seeder
{
    public function run(): void
    {
        // base departments / categories
        DB::table('support_departments')->updateOrInsert(
            ['slug' => 'general'],
            [
                'name'       => 'پشتیبانی عمومی',
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $depId = DB::table('support_departments')->where('slug', 'general')->value('id');

        DB::table('support_categories')->updateOrInsert(
            ['slug' => 'account'],
            [
                'department_id' => $depId,
                'name'          => 'مشکل حساب کاربری',
                'is_active'     => true,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]
        );
        $catId = DB::table('support_categories')->where('slug', 'account')->value('id');

        $users = DB::table('users')->pluck('id')->all();
        if (empty($users)) {
            $this->command?->warn('No users for SupportSeeder.');
            return;
        }

        $statusEnum   = ['open', 'in_progress', 'waiting_user', 'closed'];
        $priorityEnum = ['low', 'medium', 'high'];

        for ($i = 1; $i <= 8; $i++) {
            $uid = $users[array_rand($users)];

            $ticketId = DB::table('tickets')->insertGetId([
                'code'              => 'TCK-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'user_id'           => $uid,
                'department_id'     => $depId,
                'category_id'       => $catId,
                'assignee_user_id'  => null,
                'subject'           => "درخواست پشتیبانی شماره {$i}",
                'status'            => $statusEnum[array_rand($statusEnum)],
                'priority'          => $priorityEnum[array_rand($priorityEnum)], // 👈 valid values now
                'last_activity_at'  => now(),
                'closed_at'         => null,
                'unread_for_user'   => 0,
                'unread_for_support'=> 0,
                'source'            => 'web',
                'meta'              => json_encode([]),
                'created_at'        => now()->subDays(rand(1, 10)),
                'updated_at'        => now(),
            ]);

            // messages
            $msgCount = rand(1, 3);
            for ($m = 1; $m <= $msgCount; $m++) {
                DB::table('ticket_messages')->insert([
                    'ticket_id'        => $ticketId,
                    'sender_user_id'   => $uid,
                    'sender_role'      => 'user',
                    'is_internal_note' => false,
                    'body'             => "پیام {$m} برای تیکت {$ticketId}",
                    'attachments_count'=> 0,
                    'read_by_user'     => true,
                    'read_by_support'  => false,
                    'created_at'       => now()->subMinutes(rand(1, 500)),
                    'updated_at'       => now(),
                ]);
            }

            DB::table('ticket_events')->insert([
                'ticket_id'     => $ticketId,
                'actor_user_id' => $uid,
                'type'          => 'created',
                'payload'       => json_encode([]),
                'created_at'    => now(),
            ]);
        }

        $this->command?->info('✓ Support tickets/messages seeded.');
    }
}