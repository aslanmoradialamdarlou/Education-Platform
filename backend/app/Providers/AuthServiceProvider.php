<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

use App\Models\Content\Content;
use App\Models\Curriculum\{Book, Chapter, Subchapter};
use App\Models\Blog\BlogPost;

use App\Policies\{ContentPolicy, BookPolicy, ChapterPolicy, SubchapterPolicy, BlogPostPolicy};

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
        Content::class    => ContentPolicy::class,
        Book::class       => BookPolicy::class,
        Chapter::class    => ChapterPolicy::class,
        Subchapter::class => SubchapterPolicy::class,
        BlogPost::class   => BlogPostPolicy::class,

    ];

    /**
     * Register any authentication / authorization services.
     */

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function ($user, $ability) {
            // Allow both canonical 'admin' and legacy 'Administrator' roles
            if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin','Administrator'])) {
                return true;
            }
            return null;
        });

        Gate::define('catalog.manage', function ($user) {
            // Avoid throwing when permission missing; allow admin/Administrator by role
            if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin','Administrator'])) return true;
            try {
                return method_exists($user, 'hasPermissionTo') ? $user->hasPermissionTo('catalog.manage') : false;
            } catch (\Throwable $e) {
                return false;
            }
        });
    }
}
