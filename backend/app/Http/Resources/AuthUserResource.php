<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class AuthUserResource extends JsonResource
{
    public function toArray($request): array
    {
        $base = (new UserResource($this->resource))->toArray($request);

        // Get active subscriptions
        $activeSubscriptions = $this->resource->subscriptions()
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now())
            ->orderBy('end_date', 'desc')
            ->get();

        $hasSubscription = $activeSubscriptions->isNotEmpty();
        $primarySubscription = $activeSubscriptions->first();
        
        // Calculate total tokens from all active subscriptions
        $totalTokens = $this->resource->tokenCounters()
            ->where('valid_until', '>=', now())
            ->sum(DB::raw('tokens_total - tokens_used'));

        return $base + [
                'grade' => $this->whenLoaded('grade', fn () => (new GradeResource($this->grade))->toArray($request)),
                // getRoleNames is a method provided by the HasRoles trait on the model instance
                'roles' => (method_exists($this->resource, 'getRoleNames'))
                    ? collect($this->resource->getRoleNames())->values()
                    : [],
                // convenience single role (first role or 'admin' if present) to help clients that expect a single role
                'role' => (function () {
                    try {
                        if (! method_exists($this->resource, 'getRoleNames')) return null;
                        $names = collect($this->resource->getRoleNames())->map(fn($r) => is_string($r) ? $r : ($r['name'] ?? ($r->name ?? null)))->filter()->values();
                        if ($names->contains('admin')) return 'admin';
                        return $names->first() ?? null;
                    } catch (\Throwable $_) { return null; }
                })(),
                // Subscription information
                'hasSubscription' => $hasSubscription,
                'subscriptionExpiry' => $primarySubscription?->end_date,
                'tokenCount' => (int) $totalTokens,
            ];
    }
}
