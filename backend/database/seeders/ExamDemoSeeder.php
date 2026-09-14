<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExamDemoSeeder extends Seeder
{
    public function run(): void
    {
        $questions = DB::table('questions')->limit(50)->get();
        $users     = DB::table('users')->pluck('id')->all();
        $headerId  = DB::table('header_templates')->value('id');

        if ($questions->isEmpty() || empty($users)) {
            $this->command?->warn('No questions/users for ExamDemoSeeder.');
            return;
        }

        for ($e = 1; $e <= 5; $e++) {
            $examId = DB::table('exams')->insertGetId([
                'user_id'            => $users[array_rand($users)],
                'title'              => "آزمون نمونه شماره {$e}",
                'header_template_id' => $headerId,
                'settings'           => json_encode(['shuffle' => true, 'duration' => 30], JSON_UNESCAPED_UNICODE),
                // 👇 your table only allows 'draft' or 'finalized'
                'status'             => $e === 1 ? 'finalized' : 'draft',
                'total_points'       => 20,
                'token_cost'         => rand(5, 20),
                // layout is JSON in your table, so give it a small JSON object
                'layout'             => json_encode(['type' => 'default']),
                'created_at'         => now()->subDays(rand(1, 15)),
                'updated_at'         => now(),
            ]);

            // attach 8–12 questions
            $picked = $questions->shuffle()->take(rand(8, 12))->values();
            $order  = 1;
            foreach ($picked as $q) {
                DB::table('exam_questions')->insert([
                    'exam_id'      => $examId,
                    'question_id'  => $q->id,
                    'order_number' => $order++,
                    'points'       => 1,
                ]);
            }

            // optional: create an export record only if table/columns match
            DB::table('exam_exports')->insert([
                'exam_id'    => $examId,
                'file_url'   => "/storage/exams/demo-exam-{$examId}.pdf",
                'variant'    => 'A',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command?->info('✓ Demo exams with questions seeded.');
    }
}