<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** خروجی عمومی کاربر (بدون جزئیات نقش/اشتراک) */
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $name = $this->name ?? trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
        
        // Generate avatar URL - use storage URL for uploaded images, or fallback to gravatar/default
        $avatarUrl = null;
        if ($this->avatar) {
            if (str_starts_with($this->avatar, 'http')) {
                $avatarUrl = $this->avatar; // External URL
            } else {
                $avatarUrl = url('storage/' . $this->avatar); // Local storage
            }
        } else {
            // Fallback to placeholder
            $avatarUrl = 'https://i.pravatar.cc/150?u=' . ($this->id ?? 'default');
        }

        return [
            'id'          => (int) $this->id,
            'first_name'  => $this->first_name,
            'last_name'   => $this->last_name,
            'name'        => $name ?: null,
            'phone'       => $this->phone,
            'email'       => $this->email,
            'city'        => $this->city,
            'province'    => $this->province,
            'school_name' => $this->school_name,
            'grade_id'    => $this->grade_id,
            'avatar'      => $avatarUrl,
        ];
    }
}
