<?php

namespace App\Policies;

use App\Models\User;

class CatalogPolicy
{
    public function before(User $user): ?bool
    {
        // اگر نقش ادمین دارد همه‌چیز آزاد
        return $user->hasRole('admin') ? true : null;
    }

    public function manage(User $user): bool
    {
        // یا از پرمیژن‌ها استفاده کن:
        return $user->hasPermissionTo('catalog.manage');
    }
}
