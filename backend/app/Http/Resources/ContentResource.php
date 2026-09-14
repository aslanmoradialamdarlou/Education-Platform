<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ContentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => (int) $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'is_free'     => (bool) $this->is_free,
            'thumbnail'   => $this->thumbnail ?? $this->cover_image_url ?? null,
            'duration'    => $this->duration ?? null,
            'duration_sec'=> $this->duration_sec ?? null,
            'teacher'     => $this->teacher ?? $this->author ?? null,
            'view_count'  => (int) ($this->view_count ?? 0),
            'subscription_id' => $this->subscription_id ?? null,
            'type'        => [
                'id'   => (int) $this->type?->id, // Safe access
                'name' => $this->type?->name,    // Safe access
                'slug' => $this->type?->slug,    // Safe access
            ],
            // Use nullsafe operator (?->) for all optional chained relationships
            'subchapter'  => $this->subchapter ? [
                'id'     => (int) ($this->subchapter->id ?? 0),
                'number' => $this->subchapter->number,
                'title'  => $this->subchapter->title,
                
                // SAFELY access the chapter relationship
                'chapter' => $this->subchapter->chapter ? [
                    'id'    => (int) $this->subchapter->chapter->id,
                    'title' => $this->subchapter->chapter->title,
                    
                    // SAFELY access the book relationship
                    'book'  => $this->subchapter->chapter->book ? [
                        'id'       => (int) $this->subchapter->chapter->book->id,
                        'title'    => $this->subchapter->chapter->book->title,
                        // Access grade_id safely, as it's optional on the book
                        'grade_id' => $this->subchapter->chapter->book->grade_id, 
                    ] : null,
                ] : null,
            ] : null,
            'created_at'  => $this->created_at?->toISOString(),
        ];
    }
}