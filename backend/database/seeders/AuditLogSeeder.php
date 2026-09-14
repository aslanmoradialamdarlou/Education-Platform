<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $users  = DB::table('users')->pluck('id')->all();
        $posts  = DB::table('blog_posts')->pluck('id')->all();
        $conts  = DB::table('contents')->pluck('id')->all();
        $exams  = DB::table('exams')->pluck('id')->all();

        if (empty($users)) {
            $this->command?->warn('No users for AuditLogSeeder.');
            return;
        }

        $actions = [
            ['action' => 'created',   'entity_type' => 'blog_post', 'pool' => $posts],
            ['action' => 'updated',   'entity_type' => 'content',   'pool' => $conts],
            ['action' => 'finalized', 'entity_type' => 'exam',      'pool' => $exams],
            ['action' => 'login',     'entity_type' => 'user',      'pool' => $users],
        ];

        foreach (range(1, 40) as $i) {
            $actor = $users[array_rand($users)];
            $pick  = $actions[array_rand($actions)];

            $entityId = !empty($pick['pool'])
                ? $pick['pool'][array_rand($pick['pool'])]
                : null;

            DB::table('audit_logs')->insert([
                'actor_user_id' => $actor,
                'action'        => $pick['action'],
                'entity_type'   => $pick['entity_type'],
                'entity_id'     => $entityId,
                'meta'          => json_encode([
                    'ip'         => '10.0.0.' . rand(2, 200),
                    'user_agent' => 'SeederBot/1.0',
                ], JSON_UNESCAPED_UNICODE),
                'created_at'    => now()->subMinutes(rand(1, 20000)),
            ]);
        }

        $this->command?->info('✓ Audit logs seeded.');
    }
}