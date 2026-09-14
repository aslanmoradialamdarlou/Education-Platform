<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Resources\Json\JsonResource;

class BlogCategoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'slug'      => $this->slug,
            'posts_count' => $this->whenCounted('posts'),
            'created_at'=> optional($this->created_at)->toAtomString(),
            'updated_at'=> optional($this->updated_at)->toAtomString(),
        ];
    }
}
