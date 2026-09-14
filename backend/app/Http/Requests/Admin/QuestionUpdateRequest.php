<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is enforced via route/controller middleware; keep permissive here.
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('type_id') && $this->filled('type')) {
            $name = strtolower((string) $this->input('type'));
            $map = [
                'test' => 'mcq',
                'matching' => 'match',
                'fillblank' => 'fill_blank',
                'short' => 'short_answer',
                'long' => 'descriptive',
                'truefalse' => 'mcq',
            ];
            $canonical = $map[$name] ?? $name;
            $allowed = ['mcq','match','fill_blank','short_answer','descriptive'];
            if (in_array($canonical, $allowed, true)) {
                $type = \App\Models\Question\QuestionType::firstOrCreate(['name' => $canonical]);
                if ($type && $type->id) $this->merge(['type_id' => $type->id]);
            }
        }

        if (!$this->filled('subchapter_id') && $this->filled('chapter_id') && $this->filled('subchapter_number')) {
            $chapterId = (int) $this->input('chapter_id');
            $no = (int) $this->input('subchapter_number');
            $sub = \App\Models\Curriculum\Subchapter::firstOrCreate(
                ['chapter_id' => $chapterId, 'number' => $no],
                ['title' => "زیر‌فصل {$no}"]
            );
            if ($sub && $sub->id) $this->merge(['subchapter_id' => $sub->id]);
        }
    }

    public function rules(): array
    {
        return [
            'type_id'       => ['sometimes','integer','exists:question_types,id'],
            // Curriculum hierarchy
            'grade_id'          => ['nullable','integer','exists:grades,id'],
            'book_id'           => ['nullable','integer','exists:books,id'],
            'chapter_id'        => ['nullable','integer','exists:chapters,id'],
            'subchapter_id' => ['sometimes','integer','exists:subchapters,id'],
            'subchapter_number' => ['sometimes','integer','min:1'],
            'difficulty'    => ['nullable', Rule::in(['easy','medium','hard'])],
            'source'        => ['nullable','string','max:150'],
            'book_page'     => ['nullable','integer','min:1'],
            'image_url'     => ['nullable','url','max:2048'],
            'question_text' => ['sometimes','string'],
            'answer_text'   => ['nullable','string'],

            'is_free'       => ['boolean'],
            'status'        => ['nullable', Rule::in(['draft','published','archived'])],
            'token_price'   => ['nullable','integer','min:0'],

            'options'               => ['array'],
            'options.*.label'       => ['nullable','string','max:10'],
            'options.*.text'        => ['required_with:options','string'],
            'options.*.is_correct'  => ['required_with:options','boolean'],

            'pairs'                 => ['array'],
            'pairs.*.left_text'     => ['required_with:pairs','string'],
            'pairs.*.right_text'    => ['required_with:pairs','string'],
            'pairs.*.match_key'     => ['nullable','string','max:50'],

            'blanks'                => ['array'],
            'blanks.*.blank_index'  => ['required_with:blanks','integer','min:1'],
            'blanks.*.correct_text' => ['required_with:blanks','string','max:255'],

            'tag_ids'               => ['array'],
            'tag_ids.*'             => ['integer','exists:question_tags,id'],
        ];
    }
}
