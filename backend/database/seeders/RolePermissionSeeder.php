<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // نقش‌ها
        $roles = [
            ['name' => 'Administrator', 'slug' => 'admin'],
            ['name' => 'Teacher',       'slug' => 'teacher'],
            ['name' => 'Student',       'slug' => 'student'],
            ['name' => 'Guest',         'slug' => 'guest'],
        ];

        foreach ($roles as $r) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $r['slug']],
                ['name' => $r['name']]
            );
        }

        // چند پرمیژن پایه (بعداً کامل می‌کنیم)
        $perms = [
            ['name' => 'View Content',   'slug' => 'content.view'],
            ['name' => 'Create Content', 'slug' => 'content.create'],
            ['name' => 'Update Content', 'slug' => 'content.update'],
            ['name' => 'Delete Content', 'slug' => 'content.delete'],
        ];

        foreach ($perms as $p) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $p['slug']],
                ['name' => $p['name']]
            );
        }

        // اتصال پایه: admin همه‌چیز
        $adminId  = DB::table('roles')->where('slug','admin')->value('id');
        $permIds  = DB::table('permissions')->pluck('id')->all();
        foreach ($permIds as $pid) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id'=>$adminId,'permission_id'=>$pid],
                []
            );
        }
    }
}
