<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\{Role, Permission};
use Spatie\Permission\PermissionRegistrar;
use App\Models\User;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ همیشه کشِ نقش‌ها/پرمیژن‌ها را خالی کن
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = 'api';

        /* ---------------------------------------
         | 1) نقش‌ها
         --------------------------------------- */
        $roleNames = ['admin', 'teacher', 'student', 'guest'];
        foreach ($roleNames as $name) {
            Role::findOrCreate($name, $guard);
        }

        /* ---------------------------------------
         | 2) پرمیژن‌ها (خوشه‌بندی شده)
         | نکته: اسامی کلیدی که قبلاً استفاده کرده‌ای حفظ شده‌اند
         | و موارد جدید برای پوشش کامل سناریو اضافه شده‌اند.
         --------------------------------------- */

        // کاتالوگ آموزشی
        $catalogPerms = [
            'grades.view', 'books.view', 'chapters.view', 'subchapters.view',
            'catalog.manage', // اگر لازم شد مدیریت کاتالوگ (CRUD)
        ];

        // محتوا
        $contentPerms = [
            'contents.view', 'contents.create', 'contents.update', 'contents.delete',
            'content-types.manage', // مدیریت نوع محتوا
        ];

        // بلاگ
        $blogPerms = [
            'blog.view',    // مشاهده آرشیو/پست‌ها
            'blog.manage',  // مدیریت کامل (CRUD پست/دسته)
        ];

        // بانک سؤال و آزمون‌ها (PDF)
        $questionBankPerms = [
            'questions.view', 'questions.create', 'questions.update', 'questions.delete',
            'question-tags.manage',
            'exams.create', 'exams.update', 'exams.delete',
            'exam-exports.create', 'exam.templates.manage', // خروجی PDF
        ];

        // آزمایشگاه‌ها و فعالیت‌ها
        $labPerms = [
            'labs.view', 'labs.create', 'labs.update', 'labs.delete',
        ];

        // پلن/توکن/اشتراک
        $subscriptionPerms = [
            'plans.view', 'plans.manage', 'plan-access.manage',
            'subscriptions.view', 'subscriptions.manage',
            'tokens.view', 'tokens.manage',
        ];

        // تجارت/مالی: سفارش/تراکنش/کوپن/کیف پول/بازگشت وجه
        $commercePerms = [
            'orders.view', 'orders.manage',
            'transactions.view',
            'refunds.manage',
            'coupons.manage',
            'wallet.view', 'wallet.adjust',
        ];

        // اجتماعی/نظرات/امتیازدهی
        $socialPerms = [
            'comments.moderate', // مدیریت/بازبینی نظرات
            'ratings.view',
            'favorites.view',
        ];

        // اعلان‌ها/وبهوک/گزارشات/ریپورت‌ها
        $notifyReportPerms = [
            'notifications.send',         // ارسال اعلان داخلی
            'notifications.pref.manage',  // مدیریت تنظیمات اعلان
            'webhooks.manage',
            'reports.view', 'reports.finance', 'reports.usage',
        ];

        // تجمیع برای ساخت/ثبت
        $allPerms = array_unique(array_merge(
            $catalogPerms,
            $contentPerms,
            $blogPerms,
            $questionBankPerms,
            $labPerms,
            $subscriptionPerms,
            $commercePerms,
            $socialPerms,
            $notifyReportPerms,
        ));

        foreach ($allPerms as $p) {
            Permission::findOrCreate($p, $guard);
        }

        /* ---------------------------------------
         | 3) ماتریس نقش ← پرمیژن
         --------------------------------------- */

        /** @var Role $admin */
        $admin   = Role::findByName('admin', $guard);
        $teacher = Role::findByName('teacher', $guard);
        $student = Role::findByName('student', $guard);
        $guest   = Role::findByName('guest', $guard);

        // ادمین: همه‌چیز
        $admin->syncPermissions(Permission::where('guard_name', $guard)->pluck('name')->all());

        // معلم: مدیریت محتوا + مشاهده کاتالوگ + بانک‌سؤال و آزمون (غیرمالی)
        $teacher->syncPermissions(array_merge(
        // کاتالوگ: دسترسی مشاهده
            ['grades.view','books.view','chapters.view','subchapters.view'],

            // محتوا: ایجاد/ویرایش/مشاهده
            ['contents.view','contents.create','contents.update'],

            // بانک سؤال/آزمون: ایجاد/ویرایش/خروجی
            ['questions.view','questions.create','questions.update','exam-exports.create','exams.create','exams.update'],

            // بلاگ: اگر معلم‌ها هم پست می‌گذارند
            ['blog.manage'],

            // آزمایشگاه: ایجاد/ویرایش
            ['labs.view','labs.create','labs.update'],

            // اعلان‌های شخصی
            ['notifications.pref.manage'],

        // (بدون دسترسی مالی/اشتراک/کیف پول)
        ));

        // دانش‌آموز: مشاهده + ساخت آزمون PDF (در چارچوب توکن‌ها)
        $student->syncPermissions([
            // کاتالوگ
            'grades.view','books.view','chapters.view','subchapters.view',
            // محتوا
            'contents.view',
            // بانک سؤال/آزمون (ساخت آزمون و خروجی PDF)
            'questions.view','exams.create','exam-exports.create',
            // بلاگ/اجتماعی
            'blog.view','ratings.view','favorites.view',
            // اعلان‌های شخصی/داخلی
            'notifications.pref.manage',
            // کیف پول فقط مشاهده
            'wallet.view',
        ]);

        // مهمان: حداقلی
        $guest->syncPermissions([
            'grades.view','books.view','chapters.view',
            'contents.view', // (فرِی) نمایش عمومی
            'blog.view',
        ]);

        /* ---------------------------------------
         | 4) انتساب نقش به یک ادمین موجود
         --------------------------------------- */
        $adminUser = User::where('phone','09120000000')
            ->orWhere('email','admin@example.test')
            ->first()
            ?? User::first();

        if ($adminUser && method_exists($adminUser, 'assignRole')) {
            // مطمئن شو گارد درست است
            $adminUser->assignRole('admin');
        }

        /* ---------------------------------------
         | 5) پایان: پاکسازی کش
         --------------------------------------- */
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
