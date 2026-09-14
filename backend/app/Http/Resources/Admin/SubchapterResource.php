<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubchapterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'chapter' => [
                'id'     => $this->chapter_id,
                'title'  => $this->whenLoaded('chapter', fn() => $this->chapter->title),
                'number' => $this->whenLoaded('chapter', fn() => $this->chapter->number),
                'book'   => $this->whenLoaded('chapter', fn() =>
                $this->chapter->relationLoaded('book')
                    ? ['id'=>$this->chapter->book_id, 'title'=>$this->chapter->book->title]
                    : null
                ),
            ],
            'number'  => $this->number,
            'title'   => $this->title,
            'contents_cnt' => $this->when(isset($this->contents_count), $this->contents_count),
            'created_at'   => optional($this->created_at)->toDateTimeString(),
            'updated_at'   => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
