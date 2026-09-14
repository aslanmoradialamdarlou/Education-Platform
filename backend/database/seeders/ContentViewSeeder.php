<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ContentViewSeeder extends Seeder
{
    public function run(): void
    {
        $contents = DB::table('contents')->pluck('id')->all();
        $users    = DB::table('users')->pluck('id')->all();

        if (empty($contents) || empty($users)) {
            $this->command?->warn('No contents or users for ContentViewSeeder.');
            return;
        }

        // make ~300 random views
        for ($i = 0; $i < 300; $i++) {
            DB::table('content_views')->insert([
                'user_id'   => $users[array_rand($users)],
                'content_id'=> $contents[array_rand($contents)],
                'viewed_at' => Carbon::now()->subMinutes(rand(1, 10000)),
            ]);
        }

        $this->command?->info('✓ Random content views seeded.');
    }
}