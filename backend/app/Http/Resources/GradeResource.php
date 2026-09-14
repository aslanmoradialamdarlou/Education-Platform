<?php

// app/Http/Resources/GradeResource.php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray($request)
    {
        // فلگ include=stats
        $withStats = str_contains((string) $request->query('include'), 'stats');

        return [
            'id'   => (int) $this->id,
            'name' => (string) $this->name,
            'stats' => $withStats ? [
                'books'    => (int) ($this->books_count ?? 0),
                'chapters' => (int) ($this->chapters_count ?? 0),
            ] : null,
        ];
    }
}
