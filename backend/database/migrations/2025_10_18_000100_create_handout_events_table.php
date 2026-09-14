<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('handout_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('handout_id')->constrained('handouts')->onDelete('cascade');
            $table->enum('event_type', ['view','download'])->index();
            $table->timestamp('created_at')->useCurrent();
        });
        Schema::table('handout_events', function (Blueprint $table) {
            $table->index(['handout_id', 'event_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('handout_events');
    }
};
