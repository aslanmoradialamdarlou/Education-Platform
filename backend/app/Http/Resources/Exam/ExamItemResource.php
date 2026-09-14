<?php
namespace App\Http\Resources\Exam;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'           => $this->id,
            'order_number' => $this->order_number,
            'points'       => $this->points,
            'question'     => [
                'id'            => $this->question->id,
                'type'          => $this->question->type?->name,
                'difficulty'    => $this->question->difficulty,
                'book_page'     => $this->question->book_page,
                'question_text' => $this->question->question_text,
                'is_free'       => (bool)$this->question->is_free,
            ],
        ];
    }
}
