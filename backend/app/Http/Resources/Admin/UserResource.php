<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $now = now();
        $activeSub = $this->subscriptions()
            ->where('status','active')
            ->where('start_date','<=',$now->toDateString())
            ->where('end_date','>=',$now->toDateString())
            ->with('plan:id,name,slug')
            ->latest('end_date')
            ->first();

        // Generate avatar URL
        $avatarUrl = null;
        if ($this->avatar) {
            // If avatar starts with http, it's an external URL
            if (str_starts_with($this->avatar, 'http')) {
                $avatarUrl = $this->avatar;
            } else {
                // It's a local file, generate storage URL
                $avatarUrl = url('storage/' . $this->avatar);
            }
        }

        return [
            'id'          => $this->id,
            'first_name'  => $this->first_name,
            'last_name'   => $this->last_name,
            'name'        => $this->name ?? trim(($this->first_name).' '.($this->last_name)),
            'phone'       => $this->phone,
            'email'       => $this->email,
            'province'    => $this->province,
            'city'        => $this->city,
            'avatar'      => $avatarUrl,
            'is_active'   => (bool) $this->is_active && $this->suspended_at === null,
            'grade'       => $this->grade ? [
                'id'   => $this->grade->id,
                'name' => $this->grade->name,
            ] : null,
            'roles'       => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')->values()),
            'subscription'=> $activeSub ? [
                'status'  => 'active',
                'plan'    => $activeSub->plan?->name,
                'ends_at' => $activeSub->end_date,
            ] : null,
            'joined_at'   => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
