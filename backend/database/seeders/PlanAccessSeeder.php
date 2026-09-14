<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanAccessSeeder extends Seeder
{
    public function run(): void
    {
        $plans   = DB::table('subscription_plans')->get();
        $grades  = DB::table('grades')->pluck('id')->all();
        $books   = DB::table('books')->get();
        $chapters= DB::table('chapters')->get();
        $subs    = DB::table('subchapters')->get();

        if ($plans->isEmpty()) {
            $this->command?->warn('No plans for PlanAccessSeeder.');
            return;
        }

        foreach ($plans as $plan) {
            // give plan access to 1–2 grades
            $pickGrades = collect($grades)->shuffle()->take(rand(1, 2))->all();
            foreach ($pickGrades as $gid) {
                DB::table('plan_access')->updateOrInsert(
                    [
                        'plan_id'   => $plan->id,
                        'grade_id'  => $gid,
                        'book_id'   => null,
                        'chapter_id'=> null,
                        'subchapter_id' => null,
                    ],
                    []
                );
            }

            // also map to 2 random books of those grades
            $planBooks = $books->whereIn('grade_id', $pickGrades)->shuffle()->take(2);
            foreach ($planBooks as $book) {
                DB::table('plan_access')->updateOrInsert(
                    [
                        'plan_id'   => $plan->id,
                        'grade_id'  => $book->grade_id,
                        'book_id'   => $book->id,
                        'chapter_id'=> null,
                        'subchapter_id' => null,
                    ],
                    []
                );
            }

            // also map 2 random chapters (to show fine-grain)
            $planChapters = $chapters->shuffle()->take(2);
            foreach ($planChapters as $ch) {
                DB::table('plan_access')->updateOrInsert(
                    [
                        'plan_id'   => $plan->id,
                        'grade_id'  => null,
                        'book_id'   => $ch->book_id,
                        'chapter_id'=> $ch->id,
                        'subchapter_id' => null,
                    ],
                    []
                );
            }

            // and maybe 1 subchapter
            $sub = $subs->shuffle()->first();
            if ($sub) {
                DB::table('plan_access')->updateOrInsert(
                    [
                        'plan_id'      => $plan->id,
                        'grade_id'     => null,
                        'book_id'      => null,
                        'chapter_id'   => null,
                        'subchapter_id'=> $sub->id,
                    ],
                    []
                );
            }
        }

        $this->command?->info('✓ Plan access seeded.');
    }
}