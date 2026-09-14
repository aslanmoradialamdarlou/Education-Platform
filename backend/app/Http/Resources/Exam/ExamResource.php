<?php

namespace App\Http\Resources\Exam;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray($request)
    {
        $this->resource->loadMissing(['items.question.type','headerTemplate','exports']);

        return [
            'id'    => $this->id,
            'title' => $this->title,
            'layout'=> $this->layout,
            'header_template' => $this->headerTemplate ? [
                'id' => $this->headerTemplate->id,
                'name' => $this->headerTemplate->name,
            ] : null,
            'items' => $this->items->sortBy('order_number')->values()->map(function ($it) {
                return [
                    'id'           => $it->id,
                    'order_number' => $it->order_number,
                    'points'       => $it->points,
                    'question'     => [
                        'id'   => $it->question?->id,
                        'type' => $it->question?->type?->name,
                        'text' => $it->question?->question_text,
                    ],
                ];
            }),
            'exports' => $this->exports->map(fn($ex)=>[
                'id' => $ex->id,
                'file_url' => $ex->file_url,
                'created_at' => optional($ex->created_at)->toDateTimeString(),
            ]),
            'created_at' => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
