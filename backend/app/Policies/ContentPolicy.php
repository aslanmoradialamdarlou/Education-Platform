<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Content\Content;

class ContentPolicy
{
    public function viewAny(?User $user): bool
    {
        // همه می‌توانند لیست محتوا را ببینند (یا اگر لازم شد محدودش کن)
        return true;
    }

    public function view(?User $user, Content $content): bool
    {
        // رایگان = همه
        if ($content->is_free) return true;

        // لاگین + لایسنس معتبر (یا اشتراک فعال) ⇒ true
        if ($user) {
            // اینجا می‌تونی چک کنی: $user->videoLicenses()->where('content_id', ...)->isActive()
            return $user->can('content.view');
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->can('content.create');
    }

    public function update(User $user, Content $content): bool
    {
        // admin یا معلمِ سازنده
        if ($user->hasRole('admin')) return true;

        if ($user->can('content.update')) {
            // اگر ستون created_by داری:
            return (int)$content->created_by === (int)$user->id;
        }

        return false;
    }

    public function delete(User $user, Content $content): bool
    {
        return $user->hasRole('admin') || $user->can('content.delete');
    }
}
