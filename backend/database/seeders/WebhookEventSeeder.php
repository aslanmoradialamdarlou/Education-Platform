<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WebhookEventSeeder extends Seeder
{
    public function run(): void
    {
        foreach (range(1, 10) as $i) {
            DB::table('webhook_events')->insert([
                'provider'     => 'stripe',
                'event_type'   => 'invoice.paid',
                'payload'      => json_encode(['invoice_id' => 'INV-' . $i]),
                'status'       => 'processed',
                'received_at'  => now()->subMinutes(rand(1, 1000)),
                'processed_at' => now()->subMinutes(rand(1, 500)),
            ]);
        }

        $this->command?->info('✓ Webhook events seeded.');
    }
}