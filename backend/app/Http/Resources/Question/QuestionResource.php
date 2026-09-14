<?php
namespace App\Http\Resources\Question;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray($request)
    {
        // نوع سؤال را از relation type یا فیلد type_id بخوان
        $type = $this->type->name ?? null; // mcq|descriptive|short_answer|fill_blank|match

        return [
            'id'          => $this->id,
            'type'        => $type,
            'difficulty'  => $this->difficulty,
            'status'      => $this->status,
            'is_free'     => (bool) $this->is_free,
            'source'      => $this->source,
            'book_page'   => $this->book_page,
            'grade_id'    => $this->grade_id,
            'book_id'     => $this->book_id,
            'chapter_id'  => $this->chapter_id,
            'subchapter_id'=> $this->subchapter_id,

            'question_text' => $this->question_text,
            'answer_text'   => $this->answer_text, // برای descriptive/short_answer
            'explanation'   => $this->explanation,

            // داده‌های نوعی
            'options'  => QuestionOptionResource::collection($this->whenLoaded('options')),
            'pairs'    => QuestionPairResource::collection($this->whenLoaded('pairs')),
            'blanks'   => QuestionBlankResource::collection($this->whenLoaded('blanks')),

            // ضمیمه‌ها/تگ‌ها
            'assets'   => QuestionAssetResource::collection($this->whenLoaded('assets')),
            'tags'     => QuestionTagResource::collection($this->whenLoaded('tags')),

            'meta'        => $this->meta,
            'author'      => $this->whenLoaded('author', fn() => [
                'id'   => $this->author->id,
                'name' => trim($this->author->first_name.' '.$this->author->last_name) ?: $this->author->name,
            ]),
            'created_at'  => optional($this->created_at)->toDateTimeString(),
            'updated_at'  => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
