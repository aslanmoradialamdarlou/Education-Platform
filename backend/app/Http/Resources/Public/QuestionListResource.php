<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Resources\Json\JsonResource;

class QuestionListResource extends JsonResource
{
    public function toArray($request): array
    {
        $subchapter = $this->whenLoaded('subchapter');
        $chapter    = $subchapter?->chapter;
        $book       = $chapter?->book;
        $grade      = $book?->grade;

        // Map English type names to Persian
        $typeName = $this->whenLoaded('type', fn() => $this->type->name);
        $typeMap = [
            'mcq'        => 'چهارگزینه‌ای',
            'test'       => 'چهارگزینه‌ای',
            'match'      => 'وصل‌کردنی',
            'matching'   => 'وصل‌کردنی',
            'truefalse'  => 'درست/نادرست',
            'true_false' => 'درست/نادرست',
            'fillblank'  => 'جاهای خالی',
            'fill_blank' => 'جاهای خالی', // Database uses underscore
            'short'      => 'پاسخ کوتاه',
            'short_answer' => 'پاسخ کوتاه',
            'long'       => 'پاسخ بلند',
            'long_answer' => 'پاسخ بلند',
            'essay'      => 'پاسخ بلند',
        ];
        $typePersian = isset($typeName) ? ($typeMap[$typeName] ?? $typeName) : null;

        return [
            'id'         => $this->id,

            'type'       => $this->whenLoaded('type', fn() => [
                'id'      => $this->type->id,
                'name'    => $this->type->name,
                'label'   => $typePersian, // Persian label for display
            ]),

            'difficulty' => $this->difficulty,
            'is_free'    => (bool) $this->is_free,
            'source'     => $this->source,
            'book_page'  => $this->book_page,

            // چون در controller گفتیم tags:id,slug,name، اینجا name در دسترس است
            'tags'       => $this->whenLoaded('tags', fn() =>
            $this->tags->map(fn($t) => [
                'id'   => $t->id,
                'slug' => $t->slug,
                'name' => $t->name,
            ])->values()
            ),

            // سلسله‌مراتب درسی – استفاده از title
            'subchapter' => $subchapter ? [
                'id'    => $subchapter->id,
                'title' => $subchapter->title,
            ] : null,

            'chapter'    => $chapter ? [
                'id'    => $chapter->id,
                'title' => $chapter->title,
            ] : null,

            'book'       => $book ? [
                'id'    => $book->id,
                'title' => $book->title,
            ] : null,

            'grade'      => $grade ? [
                'id'   => $grade->id,
                'name' => $grade->name,
            ] : null,

            // Full question text and answer for rendering in cards
            'text'       => $this->question_text,
            'answer'     => $this->answer_text,

            // Options for multiple choice questions
            'options'    => $this->whenLoaded('options', fn() =>
                $this->options->map(fn($o) => [
                    'id'         => $o->id,
                    'label'      => $o->label,
                    'text'       => $o->text,
                    'is_correct' => (bool) $o->is_correct,
                ])->values()
            ),
            
            // Helper: index of correct option (for MCQ)
            'correctIndex' => $this->whenLoaded('options', fn() => 
                $this->options->search(fn($o) => $o->is_correct)
            ),

            // Pairs for matching questions
            'pairs'      => $this->whenLoaded('pairs', fn() =>
                $this->pairs->map(fn($p) => [
                    'id'         => $p->id,
                    'left_text'  => $p->left_text,
                    'right_text' => $p->right_text,
                    'match_key'  => $p->match_key,
                ])->values()
            ),
            
            // Helper arrays for frontend matching UI
            'matchingLeft'  => $this->whenLoaded('pairs', fn() =>
                $this->pairs->pluck('left_text')->values()
            ),
            'matchingRight' => $this->whenLoaded('pairs', fn() =>
                $this->pairs->pluck('right_text')->values()
            ),
            // Each pair represents a correct match: left at index i matches right at index i
            'correctPairs'  => $this->whenLoaded('pairs', fn() =>
                $this->pairs->map(fn($p, $idx) => [
                    'left' => $idx,
                    'right' => $idx, // Correct match is same index (A1→B1, A2→B2, etc.)
                ])->values()
            ),

            // Blanks for fill-in-the-blank questions
            'blanks'     => $this->whenLoaded('blanks', fn() =>
                $this->blanks->map(fn($b) => [
                    'id'           => $b->id,
                    'blank_index'  => $b->blank_index,
                    'correct_text' => $b->correct_text,
                ])->values()
            ),

            // Assets (images, files, etc.)
            'assets'     => $this->whenLoaded('assets', fn() =>
                $this->assets->map(fn($a) => [
                    'id'       => $a->id,
                    'type'     => $a->type,
                    'file_url' => $a->file_url,
                ])->values()
            ),

            // فیکس: $this به‌جای this
            'summary'    => str($this->question_text ?? '')->limit(140)->toString(),

            'has_answer' => !empty($this->answer_text)
                || $this->relationLoaded('options')
                || $this->relationLoaded('pairs')
                || $this->relationLoaded('blanks'),

            'created_at' => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
