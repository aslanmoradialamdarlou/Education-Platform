<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1) استانداردسازی جدول permissions
        if (! Schema::hasTable('permissions')) {
            // اگر اصلاً نداشتی، از صفر بساز
            Schema::create('permissions', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('name');              // name الزامی Spatie
                $t->string('guard_name');        // الزامی Spatie
                $t->timestamps();
                $t->unique(['name','guard_name']);
            });
        } else {
            // اگر داشتی، ستون‌ها و ایندکس‌های لازم را اضافه/اصلاح کن
            Schema::table('permissions', function (Blueprint $t) {
                if (! Schema::hasColumn('permissions','name')) {
                    $t->string('name');
                }
                if (! Schema::hasColumn('permissions','guard_name')) {
                    $t->string('guard_name')->default('api');
                }
                if (! Schema::hasColumn('permissions','created_at')) {
                    $t->timestamps();
                }
            });

            // اگر قبلاً ستون slug داشتی و name خالی است، name را از slug پر کن
            if (Schema::hasColumn('permissions','slug')) {
                DB::statement("UPDATE permissions SET name = COALESCE(NULLIF(name,''), slug) WHERE (name IS NULL OR name='')");
            }

            // یونیک کامپوزیت (name, guard_name)
            // اگر ایندکس قدیمی (unique روی slug) داری و مزاحم می‌شود، اول drop کن
            $this->ensureUniqueComposite('permissions', ['name','guard_name'], 'permissions_name_guard_unique');
        }

        // 2) استانداردسازی جدول roles
        if (! Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $t) {
                $t->bigIncrements('id');
                $t->string('name');
                $t->string('guard_name');
                $t->timestamps();
                $t->unique(['name','guard_name']);
            });
        } else {
            Schema::table('roles', function (Blueprint $t) {
                if (! Schema::hasColumn('roles','name')) {
                    $t->string('name');
                }
                if (! Schema::hasColumn('roles','guard_name')) {
                    $t->string('guard_name')->default('api');
                }
                if (! Schema::hasColumn('roles','created_at')) {
                    $t->timestamps();
                }
            });

            if (Schema::hasColumn('roles','slug')) {
                DB::statement("UPDATE roles SET name = COALESCE(NULLIF(name,''), slug) WHERE (name IS NULL OR name='')");
            }

            $this->ensureUniqueComposite('roles', ['name','guard_name'], 'roles_name_guard_unique');
        }

        // 3) ساخت جداول پیوت استاندارد Spatie (اگر نیستند)
        if (! Schema::hasTable('role_has_permissions')) {
            Schema::create('role_has_permissions', function (Blueprint $t) {
                $t->unsignedBigInteger('permission_id');
                $t->unsignedBigInteger('role_id');
                $t->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
                $t->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
                $t->primary(['permission_id','role_id']);
            });
        }

        if (! Schema::hasTable('model_has_roles')) {
            Schema::create('model_has_roles', function (Blueprint $t) {
                $t->unsignedBigInteger('role_id');
                $t->string('model_type');
                $t->unsignedBigInteger('model_id');
                $t->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
                $t->index(['model_id','model_type'], 'model_has_roles_model_id_model_type_index');
                $t->primary(['role_id','model_id','model_type']);
            });
        }

        if (! Schema::hasTable('model_has_permissions')) {
            Schema::create('model_has_permissions', function (Blueprint $t) {
                $t->unsignedBigInteger('permission_id');
                $t->string('model_type');
                $t->unsignedBigInteger('model_id');
                $t->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
                $t->index(['model_id','model_type'], 'model_has_permissions_model_id_model_type_index');
                $t->primary(['permission_id','model_id','model_type']);
            });
        }

        // 4) پُرت داده از پیوت‌های legacy (تنها اگر وجود دارند)
        // role_permissions (legacy)  => role_has_permissions
        if (Schema::hasTable('role_permissions')) {
            $rows = DB::table('role_permissions')->select('role_id','permission_id')->get();
            foreach ($rows as $row) {
                DB::table('role_has_permissions')->updateOrInsert([
                    'role_id'       => $row->role_id,
                    'permission_id' => $row->permission_id,
                ], []);
            }
        }

        // user_roles (legacy) => model_has_roles
        if (Schema::hasTable('user_roles')) {
            $rows = DB::table('user_roles')->select('user_id','role_id')->get();
            foreach ($rows as $row) {
                DB::table('model_has_roles')->updateOrInsert([
                    'role_id'    => $row->role_id,
                    'model_type' => \App\Models\User::class,
                    'model_id'   => $row->user_id,
                ], []);
            }
        }

        // user_permissions (legacy) => model_has_permissions
        if (Schema::hasTable('user_permissions')) {
            $rows = DB::table('user_permissions')->select('user_id','permission_id')->get();
            foreach ($rows as $row) {
                DB::table('model_has_permissions')->updateOrInsert([
                    'permission_id' => $row->permission_id,
                    'model_type'    => \App\Models\User::class,
                    'model_id'      => $row->user_id,
                ], []);
            }
        }

        // 5) guard_name را برای همه مقداردهی کن (اگر خالی است)
        DB::statement("UPDATE permissions SET guard_name='api' WHERE guard_name IS NULL OR guard_name=''");
        DB::statement("UPDATE roles SET guard_name='api' WHERE guard_name IS NULL OR guard_name=''");
    }

    public function down(): void
    {
        // جدول‌های پیوت Spatie را پاک می‌کنیم (بازگشت‌پذیری پایه)
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('role_has_permissions');

        // ایندکس یونیک را می‌توانی برداری، اما ساختار roles/permissions را دست نمی‌زنیم
        // تا داده‌ها از بین نرود.
    }

    private function ensureUniqueComposite(string $table, array $cols, string $name): void
    {
        // حذف ایندکس‌های قدیمی که ممکن است مزاحم باشند
        // (MySQL اجازهٔ rename مستقیم همهٔ ایندکس‌ها را نمی‌دهد، محافظه‌کارانه برخورد می‌کنیم)
        try {
            DB::statement("ALTER TABLE {$table} DROP INDEX {$name}");
        } catch (\Throwable $e) {
            // نادیده بگیر
        }
        // ساخت یونیک جدید
        try {
            DB::statement("ALTER TABLE {$table} ADD UNIQUE {$name} (".implode(',', $cols).")");
        } catch (\Throwable $e) {
            // اگر از قبل بود، مشکلی نیست
        }
    }
};
