<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Resources\Json\JsonResource;

class BookResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'    => $this->id,
            'title' => $this->title,
            'year'  => $this->year,

            'grade' => [
                'id'   => $this->grade_id,
                'name' => $this->whenLoaded('grade', fn() => $this->grade?->name),
            ],
            'subject' => [
                'id'   => $this->subject_id,
                'name' => $this->whenLoaded('subject', fn() => $this->subject?->name),
            ],

            'chapters_cnt' => $this->whenCounted('chapters'),

            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
