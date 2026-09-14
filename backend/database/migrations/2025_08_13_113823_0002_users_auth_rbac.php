<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // grades (پایه تحصیلی)
        Schema::create('grades', function (Blueprint $t) {
            $t->id(); // integer pk
            $t->string('name', 50)->unique();
        });

        // users (بروزرسانی جدول Breeze)
        Schema::table('users', function (Blueprint $t) {
            // Breeze دارد: id, name, email, email_verified_at, password, remember_token, timestamps
            // ما می‌خواهیم: first_name,last_name, phone unique, password_hash nullable, grade_id fk, city, province, school_name
            if (!Schema::hasColumn('users','first_name')) $t->string('first_name',100)->nullable()->after('id');
            if (!Schema::hasColumn('users','last_name'))  $t->string('last_name',100)->nullable()->after('first_name');

            if (!Schema::hasColumn('users','phone'))      $t->string('phone',20)->unique()->after('email');

            if (!Schema::hasColumn('users','password_hash')) $t->string('password_hash',255)->nullable()->after('phone');

            if (Schema::hasColumn('users','password')) { // ستون پیشفرض Breeze
                $t->string('password')->nullable()->change(); // می‌گذاریم nullable
            }

            if (!Schema::hasColumn('users','city'))       $t->string('city',100)->nullable();
            if (!Schema::hasColumn('users','province'))   $t->string('province',100)->nullable();
            if (!Schema::hasColumn('users','school_name'))$t->string('school_name',150)->nullable();

            if (!Schema::hasColumn('users','grade_id'))   $t->unsignedInteger('grade_id')->nullable()->references('id')->on('grades');
        });

        // otp_codes
        Schema::create('otp_codes', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('code',10);
            $t->timestampTz('expires_at');
            $t->boolean('is_used')->default(false);
            $t->timestampsTz();
        });

        // password_resets (نسخه سفارشی؛ Breeze از password_reset_tokens استفاده می‌کند – تداخلی ندارد)
        Schema::create('password_resets', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('token',100)->unique();
            $t->timestampTz('expires_at');
            $t->timestampTz('used_at')->nullable();
            $t->timestampsTz();
        });

        // sessions (Server-side session log)
        if (! Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $t) {
                $t->string('id', 128)->primary();
                $t->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
                $t->string('ip_address', 45)->nullable();
                $t->text('user_agent')->nullable();
                $t->timestamp('last_seen_at')->nullable();
            });
        }

        // login_logs
        Schema::create('login_logs', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('ip_address',45)->nullable();
            $t->text('user_agent')->nullable();
            $t->enum('login_method', ['password','otp'])->nullable(); // 👈 به جای DB::statement
            $t->timestampsTz();
        });

        /* ==== RBAC (ساده، طبق طرح شما) ==== */
        Schema::create('roles', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',50)->nullable();
            $t->string('slug',50)->unique(); // admin, teacher, student, guest
        });

        Schema::create('permissions', function (Blueprint $t) {
            $t->bigIncrements('id');
            $t->string('name',100)->nullable();
            $t->string('slug',100)->unique();
            $t->text('description')->nullable();
        });

        Schema::create('user_roles', function (Blueprint $t) {
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('role_id')->constrained()->cascadeOnDelete();
            $t->primary(['user_id','role_id']);
        });

        Schema::create('role_permissions', function (Blueprint $t) {
            $t->foreignId('role_id')->constrained()->cascadeOnDelete();
            $t->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $t->primary(['role_id','permission_id']);
        });

        Schema::create('user_permissions', function (Blueprint $t) {
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $t->primary(['user_id','permission_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('login_logs');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_resets');
        Schema::dropIfExists('otp_codes');

        // برگرداندن تغییرات users
        Schema::table('users', function (Blueprint $t) {
            if (Schema::hasColumn('users','grade_id')) $t->dropColumn('grade_id');
            foreach (['first_name','last_name','phone','password_hash','city','province','school_name'] as $c) {
                if (Schema::hasColumn('users',$c)) $t->dropColumn($c);
            }
        });

        Schema::dropIfExists('grades');
    }
};
