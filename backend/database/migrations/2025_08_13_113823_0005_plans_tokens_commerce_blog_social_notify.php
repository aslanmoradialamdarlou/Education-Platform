<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        /* ===== 7) Plans, Tokens, Subscriptions ===== */
        Schema::create('subscription_plans', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100);
            $t->string('slug',120)->unique();
            $t->text('description')->nullable();
            $t->decimal('price',12,2);
            $t->string('currency',10)->default('IRR');
            $t->integer('duration_days');
            $t->integer('token_quota');
            $t->boolean('is_active')->default(true);
        });

        Schema::create('plan_access', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $t->foreignId('book_id')->nullable()->constrained('books')->nullOnDelete();
            $t->foreignId('chapter_id')->nullable()->constrained('chapters')->nullOnDelete();
        });

        Schema::create('subscriptions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $t->date('start_date');
            $t->date('end_date');
            $t->enum('status', ['active','expired','cancelled','pending']);
        });

        Schema::create('subscription_events', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $t->enum('type', ['created','renewed','expired','upgraded','cancelled']);
            $t->json('meta')->nullable();
            $t->timestampTz('created_at')->useCurrent();
        });

        Schema::create('token_counters', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $t->integer('tokens_total');
            $t->integer('tokens_used')->default(0);
            $t->date('valid_until')->nullable();
            $t->unique(['user_id','plan_id']);
        });

        Schema::create('token_usages', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('exam_id')->nullable()->constrained('exams')->nullOnDelete();
            $t->integer('question_count');
            $t->timestampTz('used_at');
        });

        /* ===== 8) Commerce ===== */
        Schema::create('orders', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->enum('status', ['pending','paid','failed','refunded','cancelled']);
            $t->decimal('total_amount',12,2);
            $t->string('currency',10);
            $t->timestampsTz();
            $t->timestampTz('paid_at')->nullable();
        });

        Schema::create('order_items', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $t->string('item_type',20); // plan
            $t->unsignedBigInteger('item_id');
            $t->integer('qty')->default(1);
            $t->decimal('unit_price',12,2);
            $t->decimal('total_price',12,2);
        });

        Schema::create('transactions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->decimal('amount',12,2);
            $t->string('currency',10);
            $t->enum('status', ['pending','paid','failed','refunded']);
            $t->string('payment_method',50)->nullable();
            $t->string('ref_number',100)->nullable()->unique();
            $t->json('raw_payload')->nullable();
            $t->timestampsTz();
        });

        Schema::create('refunds', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $t->decimal('amount',12,2);
            $t->text('reason')->nullable();
            $t->enum('status', ['requested','approved','rejected','processed']);
            $t->timestampsTz();
        });

        Schema::create('coupons', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('code',50)->unique();
            $t->string('type',10);  // percent, fixed
            $t->decimal('value',12,2);

            // ✅ برای MySQL: از dateTime استفاده کن تا ارور default نگیری
            $t->dateTime('starts_at');
            $t->dateTime('ends_at');

            $t->integer('max_uses')->nullable();
            $t->integer('per_user_limit')->nullable();
            $t->boolean('is_active')->default(true);
            $t->json('target_rule')->nullable();
        });

        Schema::create('coupon_redemptions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('coupon_id')->constrained('coupons')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('order_id')->constrained('orders')->cascadeOnDelete();

            // ✅ این هم dateTime تا با policyهای MySQL به مشکل نخوره
            $t->dateTime('used_at');

            $t->unique(['coupon_id','user_id','order_id']);
        });

        Schema::create('wallets', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->decimal('balance',14,2)->default(0);
        });

        Schema::create('wallet_transactions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('wallet_id')->constrained('wallets')->cascadeOnDelete();
            $t->string('type',20); // deposit, withdraw, adjustment
            $t->decimal('amount',14,2);
            $t->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $t->string('reason',200)->nullable();
            $t->json('meta')->nullable();
            $t->timestampTz('created_at')->useCurrent();
        });

        /* ===== 9) Blog & Social ===== */
        Schema::create('blog_posts', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('title',200);
            $t->string('slug',220)->unique();
            $t->text('content');
            $t->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $t->enum('status', ['draft','published','archived']);
            $t->timestampTz('published_at')->nullable();
            $t->timestampsTz();
        });

        Schema::create('blog_categories', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100);
            $t->string('slug',120)->unique();
        });

        Schema::create('blog_category_post', function (Blueprint $t) {
            $t->foreignId('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $t->foreignId('blog_category_id')->constrained('blog_categories')->cascadeOnDelete();
            $t->primary(['blog_post_id','blog_category_id']);
        });

        Schema::create('comments', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('commentable_type',50);
            $t->unsignedBigInteger('commentable_id');
            $t->text('text');
            $t->enum('status', ['pending','approved','rejected']);
            $t->timestampsTz();
            $t->index(['commentable_type','commentable_id']);
        });

        Schema::create('ratings', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('rateable_type',50);
            $t->unsignedBigInteger('rateable_id');
            $t->smallInteger('rating');
            $t->timestampTz('created_at')->useCurrent();
            $t->unique(['user_id','rateable_type','rateable_id']);
        });

        Schema::create('favorites', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('target_type',50);
            $t->unsignedBigInteger('target_id');
            $t->timestampTz('created_at')->useCurrent();
            $t->unique(['user_id','target_type','target_id']);
        });

        /* ===== 10) Notifications & Integrations & Audit ===== */
        Schema::create('notifications', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type',100)->nullable();
            $t->string('title',200)->nullable();
            $t->text('body')->nullable();
            $t->json('data')->nullable();
            $t->timestampTz('read_at')->nullable();
            $t->timestampTz('created_at')->useCurrent();
        });

        Schema::create('notification_preferences', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->enum('channel', ['email','sms','push']);
            $t->boolean('enabled')->default(true);
            $t->json('quiet_hours')->nullable();
        });

        Schema::create('webhook_events', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('provider',50)->nullable();
            $t->string('event_type',100)->nullable();
            $t->json('payload')->nullable();
            $t->enum('status', ['received','processed','failed']);
            $t->timestampTz('received_at')->nullable();
            $t->timestampTz('processed_at')->nullable();
        });

        Schema::create('audit_logs', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('actor_user_id')->constrained('users')->cascadeOnDelete();
            $t->string('action',100);
            $t->string('entity_type',50);
            $t->unsignedBigInteger('entity_id');
            $t->json('meta')->nullable();
            $t->timestampTz('created_at')->useCurrent();
            $t->index(['entity_type','entity_id']);
        });

        Schema::create('rate_limits', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('key',120);
            $t->timestampTz('window_start');
            $t->integer('count');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rate_limits');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('webhook_events');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('ratings');
        Schema::dropIfExists('blog_category_post');
        Schema::dropIfExists('blog_categories');
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('coupon_redemptions');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('token_usages');
        Schema::dropIfExists('token_counters');
        Schema::dropIfExists('subscription_events');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plan_access');
        Schema::dropIfExists('subscription_plans');
    }
};
