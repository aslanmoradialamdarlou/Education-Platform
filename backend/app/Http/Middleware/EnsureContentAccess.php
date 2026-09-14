<?php

namespace App\Http\Middleware;

use App\Models\Content\Content;
use App\Services\Access\SubscriptionAccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureContentAccess
{
    public function __construct(private SubscriptionAccessService $access) {}

    public function handle(Request $request, Closure $next): Response
    {
        /** @var Content|null $content */
        $content = $request->route('content');

        if (!$content) return $next($request);

        if ($content->is_free) return $next($request);

        $user = $request->user();
        if (!$user) abort(403, 'login_required');

        if (!method_exists($this->access, 'userCanAccessContent')) {
            // اگر هنوز متد را ننوشته‌ای، با is_free برگرد
            abort(403, 'access_denied');
        }

        if (!$this->access->userCanAccessContent($user, $content)) {
            abort(403, 'access_denied');
        }

        return $next($request);
    }
}
