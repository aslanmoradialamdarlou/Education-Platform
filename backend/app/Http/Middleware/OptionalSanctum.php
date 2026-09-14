<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class OptionalSanctum
{
    public function handle(Request $request, Closure $next)
    {
        if ($token = $request->bearerToken()) {
            if ($pat = PersonalAccessToken::findToken($token)) {
                auth()->setUser($pat->tokenable);
            }
        }
        return $next($request);
    }
}
