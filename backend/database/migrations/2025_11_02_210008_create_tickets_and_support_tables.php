<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        /* ===== 0) Taxonomy (optional but useful) ===== */
        Schema::create('support_departments', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100)->unique();           // مثال: پشتیبانی فنی، مالی، محتوایی
            $t->string('slug',120)->unique();
            $t->boolean('is_active')->default(true);
            $t->timestampsTz();
        });

        Schema::create('support_categories', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('department_id')->nullable()->constrained('support_departments')->nullOnDelete();
            $t->string('name',100);
            $t->string('slug',120)->unique();
            $t->boolean('is_active')->default(true);
            $t->timestampsTz();
        });

        /* ===== 1) Tickets ===== */
        Schema::create('tickets', function (Blueprint $t) {
            $t->bigIncrements('id');

            // Human-friendly public code like "T-1000"
            $t->string('code',40)->unique()->index();

            // Who opened it
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Optional routing
            $t->foreignId('department_id')->nullable()->constrained('support_departments')->nullOnDelete();
            $t->foreignId('category_id')->nullable()->constrained('support_categories')->nullOnDelete();

            // Assignment (support agent)
            $t->foreignId('assignee_user_id')->nullable()->constrained('users')->nullOnDelete()->index();

            // Subject & basic filters used in your admin list
            $t->string('subject',200)->index();

            // Status & priority used by your UI filters
            // statuses shown in your UI: باز / در حال پیگیری / منتظر پاسخ کاربر / بسته شده
            $t->enum('status', ['open','in_progress','waiting_user','closed'])->default('open')->index();

            // priorities: کم / متوسط / زیاد
            $t->enum('priority', ['low','medium','high'])->default('low')->index();

            // Last activity for sorting the table ("آخرین بروزرسانی")
            $t->timestampTz('last_activity_at')->nullable()->index();

            // When closed
            $t->timestampTz('closed_at')->nullable()->index();

            // Simple unread counters (for badges in agent/user UIs)
            $t->unsignedInteger('unread_for_user')->default(0);
            $t->unsignedInteger('unread_for_support')->default(0);

            // Source of ticket (useful if later you add email/API)
            $t->enum('source', ['web','email','api'])->default('web')->index();

            // Extra metadata
            $t->json('meta')->nullable();

            $t->timestampsTz();

            // For search bar: subject, code, user info
            $t->fullText(['subject', 'code']);
        });

        /* ===== 2) Ticket Messages (conversation) ===== */
        Schema::create('ticket_messages', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();

            // Sender is always a user record (customer or agent)
            $t->foreignId('sender_user_id')->constrained('users')->cascadeOnDelete();

            // Distinguish role for UI (badge colors), also allows "system" notes
            $t->enum('sender_role', ['user','agent','system'])->default('user')->index();

            // Internal notes (only agents/admins see)
            $t->boolean('is_internal_note')->default(false)->index();

            $t->longText('body');

            // quick flags/counters
            $t->unsignedInteger('attachments_count')->default(0);

            // read receipts (simple)
            $t->boolean('read_by_user')->default(false)->index();
            $t->boolean('read_by_support')->default(false)->index();

            $t->timestampsTz();
        });

        /* ===== 3) Attachments (files in messages) ===== */
        Schema::create('ticket_attachments', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('message_id')->constrained('ticket_messages')->cascadeOnDelete();
            $t->string('original_name',255)->nullable();
            $t->string('storage_path',500);        // e.g. storage/app/support/...
            $t->unsignedBigInteger('size')->nullable();
            $t->string('mime',120)->nullable();
            $t->json('meta')->nullable();
            $t->timestampsTz();
            $t->index(['message_id']);
        });

        /* ===== 4) Watchers / Subscribers (optional, handy) ===== */
        Schema::create('ticket_watchers', function (Blueprint $t) {
            $t->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->primary(['ticket_id','user_id']);
        });

        /* ===== 5) Labels/Tags (optional but nice for admin filters) ===== */
        Schema::create('ticket_labels', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',80);
            $t->string('slug',100)->unique();
            $t->string('color',20)->nullable(); // hex e.g. #F59E0B
            $t->timestampsTz();
        });

        Schema::create('ticket_label_pivot', function (Blueprint $t) {
            $t->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $t->foreignId('label_id')->constrained('ticket_labels')->cascadeOnDelete();
            $t->primary(['ticket_id','label_id']);
        });

        /* ===== 6) Audit trail / Events ===== */
        Schema::create('ticket_events', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();

            // type examples: created, status_changed, priority_changed, assigned, unassigned, reopened, closed
            $t->string('type',60)->index();
            $t->json('payload')->nullable(); // before/after, reason, etc.
            $t->timestampTz('created_at')->useCurrent();
        });

        /* ===== 7) Simple canned responses (optional QoL for agents) ===== */
        Schema::create('canned_responses', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('author_user_id')->constrained('users')->cascadeOnDelete();
            $t->string('title',150);
            $t->text('content');
            $t->boolean('is_shared')->default(true); // shared across team or private
            $t->timestampsTz();
            $t->index(['author_user_id','is_shared']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canned_responses');
        Schema::dropIfExists('ticket_events');
        Schema::dropIfExists('ticket_label_pivot');
        Schema::dropIfExists('ticket_labels');
        Schema::dropIfExists('ticket_watchers');
        Schema::dropIfExists('ticket_attachments');
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('support_categories');
        Schema::dropIfExists('support_departments');
    }
};