<?php
namespace App\Http\Resources\Question;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionPairResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'        => $this->id,
            'left'      => $this->left_text,
            'right'     => $this->right_text,
            'match_key' => $this->match_key,
        ];
    }
}
