<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('video_licenses')) {
            Schema::create('video_licenses', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->foreignId('user_id')->constrained()->cascadeOnDelete();
                $t->unsignedBigInteger('content_id')->nullable();
                $t->string('license_id',120)->nullable();
                $t->text('license_key')->nullable();
                $t->string('url',500)->nullable();
                $t->string('name',150)->nullable();
                $t->json('courses')->nullable();
                $t->boolean('test')->default(false);
                $t->json('watermark')->nullable();
                $t->json('device')->nullable();
                $t->string('payload',200)->nullable();

                // ترجیح: starts_at/ends_at — اما اگر جدول قدیمی داری، در مایگریشن بعدی مپ می‌کنیم
                $t->timestamp('starts_at')->nullable();
                $t->timestamp('ends_at')->nullable();

                $t->enum('status',['active','expired','revoked','failed'])->default('active');
                $t->json('meta')->nullable();
                $t->timestampsTz();
                $t->index(['user_id','content_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('video_licenses');
    }
};
