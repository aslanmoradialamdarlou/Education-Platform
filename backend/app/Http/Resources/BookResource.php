<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BookResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'        => $this->id,
            'subject'   => [
                'id'   => $this->subject_id,
                'name' => $this->subject?->name,
            ],
            'grade'     => [
                'id'   => $this->grade_id,
                'name' => $this->grade->name ?? null,
            ],
            'title'     => $this->title,
            'year'      => (int) $this->year,
            'chapters_count' => $this->when(isset($this->chapters_count), (int) $this->chapters_count),
        ];
    }
}
