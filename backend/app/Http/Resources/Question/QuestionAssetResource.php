<?php
namespace App\Http\Resources\Question;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionAssetResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'   => $this->id,
            'type' => $this->type,
            'path' => $this->path,
            'url'  => $this->url,
            'meta' => $this->meta,
        ];
    }
}
