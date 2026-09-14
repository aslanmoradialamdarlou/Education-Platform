<?php
namespace App\Http\Resources\Public;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionPreviewResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'type'          => ['id' => $this->type?->id, 'name' => $this->type?->name],
            'difficulty'    => $this->difficulty,
            'question_text' => $this->question_text,
            'answer_text'   => $this->answer_text, // اگر بالاتر null شود اینجا هم null می‌آید
            'subchapter'    => [
                'id'    => $this->subchapter?->id,
                'title' => $this->subchapter?->title,
            ],
            'is_free'       => (bool) $this->is_free,
        ];
    }
}
