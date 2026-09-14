<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogPostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request){
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug'  => $this->slug,
            'excerpt' => $this->excerpt,
            'cover_image_url' => $this->cover_image_url,
            'content' => $this->content, // markdown
            'status' => $this->status,
            'published_at' => optional($this->published_at)->toAtomString(),
            'reading_time' => $this->reading_time,
            'is_pinned' => (bool)$this->is_pinned,
            'seo' => [
                'meta_title' => $this->meta_title,
                'meta_description' => $this->meta_description,
                'meta_keywords' => $this->meta_keywords,
                'canonical_url' => $this->canonical_url,
            ],
            'author' => [
                'id' => $this->author_id,
                'name' => $this->author?->name,
            ],
            'categories' => \App\Http\Resources\Admin\BlogCategoryResource::collection($this->whenLoaded('categories')),
            'stats' => [
                'comments_count' => $this->whenCounted('comments'),
                'likes_count'    => $this->whenCounted('likes'),
            ],
            'created_at' => optional($this->created_at)->toAtomString(),
            'updated_at' => optional($this->updated_at)->toAtomString(),
        ];
    }
}
