<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'type'    => [
                'id'   => $this->type_id,
                'name' => $this->whenLoaded('type', fn() => $this->type->name),
            ],
            'subchapter' => [
                'id'    => $this->subchapter_id,
                'title' => $this->whenLoaded('subchapter', fn() => $this->subchapter->title),
                'number'=> $this->whenLoaded('subchapter', fn() => $this->subchapter->number),
                'chapter' => $this->whenLoaded('subchapter', function () {
                    $chapter = $this->subchapter->chapter ?? null;
                    if (!$chapter) return null;
                    return [
                        'id'     => $chapter->id,
                        'title'  => $chapter->title ?? null,
                        'number' => $chapter->number ?? null,
                        'book'   => (function () use ($chapter) {
                            $book = $chapter->book ?? null;
                            if (!$book) return null;
                            return [
                                'id'      => $book->id,
                                'title'   => $book->title ?? ($book->name ?? null),
                                'subject' => (function () use ($book) {
                                    $subject = $book->subject ?? null;
                                    if (!$subject) return null;
                                    return [
                                        'id'   => $subject->id,
                                        'name' => $subject->name ?? null,
                                    ];
                                })(),
                                'grade'   => (function () use ($book) {
                                    $grade = $book->grade ?? null;
                                    if (!$grade) return null;
                                    return [
                                        'id'   => $grade->id,
                                        'name' => $grade->name ?? null,
                                    ];
                                })(),
                            ];
                        })(),
                    ];
                }),
            ],
            'title'       => $this->title,
            'description' => $this->when(isset($this->description), $this->description),
            'is_free'     => (bool) $this->is_free,
            'token_price' => (int) ($this->token_price ?? 0),
            'created_at'  => optional($this->created_at)->toDateTimeString(),
            'updated_at'  => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
