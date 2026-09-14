<?php

// app/Policies/BlogPostPolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\Blog\BlogPost;

class BlogPostPolicy
{
    public function before(User $user): ?bool
    {
        // ادمین همیشه مجاز
        if ($user->hasRole('admin') || $user->can('blog.manage')) {
            return true;
        }
        return null;
    }

    public function create(User $user): bool
    {
        return $user->can('blog.create');
    }

    public function update(User $user, BlogPost $post): bool
    {
        return $user->can('blog.update') && $post->author_id === $user->id;
    }

    public function delete(User $user, BlogPost $post): bool
    {
        return $user->can('blog.delete') && $post->author_id === $user->id;
    }

    public function view(User $user, BlogPost $post): bool
    {
        // برای admin/manage در before حل شد. بقیه آزاد (یا محدود به نیازت)
        return true;
    }
}
