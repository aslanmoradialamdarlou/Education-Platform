<?php
namespace App\Http\Resources\Question;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionOptionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'label'      => $this->label,
            'text'       => $this->text,
            'is_correct' => (bool) $this->is_correct,
        ];
    }
}
