<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Route as RouteObject;
use Illuminate\Support\Facades\Route;

class ApiDocsController extends Controller
{
    public function index()
    {
        $cfg = config('apidocs');
        $meta = $cfg['endpoints'] ?? [];
        $groups = $cfg['groups'] ?? [];
        $info = $cfg['info'] ?? [];

        // Gather all /api routes
        $all = collect(Route::getRoutes())
            ->filter(fn(RouteObject $r) => str_starts_with($r->uri(), 'api/'))
            ->map(function (RouteObject $r) {
                $uri   = '/' . ltrim($r->uri(), '/');
                $name  = $r->getName();
                $meths = $r->methods();
                $mw    = $r->gatherMiddleware();
                $ctrl  = $r->getActionName();

                // Quick flags
                $requiresAuth = collect($mw)->contains(fn($m) => str_contains($m, 'auth:sanctum'));
                $isAdmin      = collect($mw)->contains(fn($m) => str_contains($m, 'role:admin'));

                return [
                    'name'       => $name,
                    'uri'        => $uri,
                    'methods'    => $meths,
                    'middleware' => $mw,
                    'controller' => $ctrl,
                    'auth'       => $requiresAuth,
                    'admin'      => $isAdmin,
                ];
            })
            ->values();

        // Attach human docs by route name (fallback attempt by URI if needed)
        $withDocs = $all->map(function ($r) use ($meta) {
            $doc = $meta[$r['name']] ?? $meta[$r['uri']] ?? null;

            // Guess tags/group
            $tag = $doc['tags'][0] ?? $this->guessTag($r);

            return [
                ...$r,
                'doc'  => $doc,
                'tag'  => $tag,
            ];
        });

        // Group by tag
        $grouped = $withDocs->groupBy(fn($r) => $r['tag'] ?? 'other');

        return view('api-docs', compact('grouped', 'groups', 'info'));
    }

    private function guessTag(array $r): string
    {
        $u = $r['uri'];
        if (str_contains($u, '/v1/admin')) return 'admin';
        if (str_contains($u, '/payments')) return 'payments';
        if (str_contains($u, '/exams'))    return 'exams';
        if (str_contains($u, '/blog'))     return 'blog';
        if (str_contains($u, '/grades') || str_contains($u, '/books') || str_contains($u, '/chapters'))
            return 'catalog';
        if (str_contains($u, '/auth'))     return 'auth';
        if (str_contains($u, '/health') || str_contains($u, '/version'))
            return 'system';
        return 'other';
    }
}
