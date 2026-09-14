<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionDetailResource extends JsonResource
{
    public function toArray($request)
    {
        /** @var \App\Models\Question\Question $q */
        $q = $this->resource;

        return [
            'id'         => $q->id,
            'type'       => $q->type?->name,
            'difficulty' => $q->difficulty,
            'source'     => $q->source,
            'book_page'  => $q->book_page,
            'is_free'    => (bool) $q->is_free,
            'question'   => $q->question_text,
            'answer'     => $q->answer_text,

            'grade'      => $q->subchapter?->chapter?->book?->grade?->name,
            'book'       => $q->subchapter?->chapter?->book?->title,
            // ← «title» به‌جای «name»
            'chapter'    => $q->subchapter?->chapter?->title,
            'subchapter' => $q->subchapter?->title,

            // اگر در index فقط slug می‌خواهی، اینجا هم می‌توانی هماهنگ کنی
            'tags'       => $q->tags->pluck('slug'),

            'options'    => $q->options->map(fn($o) => [
                'label'      => $o->label,
                'text'       => $o->text,
                'is_correct' => (bool) $o->is_correct,
            ]),
            'pairs'      => $q->pairs->map(fn($p) => [
                'left' => $p->left_text, 'right' => $p->right_text, 'key' => $p->match_key,
            ]),
            'blanks'     => $q->blanks->map(fn($b) => [
                'index' => $b->blank_index, 'answer' => $b->correct_text,
            ]),
            'assets'     => $q->assets->map(fn($a) => [
                'id' => $a->id, 'type' => $a->type, 'url' => $a->file_url,
            ]),
        ];
    }
}
