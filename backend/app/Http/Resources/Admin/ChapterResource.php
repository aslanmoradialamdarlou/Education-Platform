<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChapterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'book'    => [
                'id'    => $this->book_id,
                'title' => $this->whenLoaded('book', fn() => $this->book->title),
                'grade' => $this->whenLoaded('book', fn() => $this->book->relationLoaded('grade')
                    ? ['id'=>$this->book->grade_id, 'name'=>$this->book->grade->name]
                    : null
                ),
                'subject' => $this->whenLoaded('book', fn() => $this->book->relationLoaded('subject')
                    ? ['id'=>$this->book->subject_id, 'name'=>$this->book->subject->name]
                    : null
                ),
            ],
            'number'  => $this->number,
            'title'   => $this->title,
            'start_page' => $this->start_page,
            'end_page' => $this->end_page,
            'subchapters_cnt' => $this->when(isset($this->subchapters_count), $this->subchapters_count),
            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
