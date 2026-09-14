<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChapterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => (int) $this->id,
            'number'  => (int) $this->number,
            'title'   => $this->title,
            'book_id' => (int) $this->book_id,
        ];
    }
}
