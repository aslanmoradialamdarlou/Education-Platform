<?php
namespace App\Http\Resources\Question;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionBlankResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'           => $this->id,
            'blank_index'  => (int) $this->blank_index,
            'correct_text' => $this->correct_text,
        ];
    }
}
