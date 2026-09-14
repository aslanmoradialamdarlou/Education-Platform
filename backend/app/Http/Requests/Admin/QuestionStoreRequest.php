<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is enforced at the route/controller level via middleware (auth:sanctum, role:admin|Administrator,api).
        // Keep this request permissive to avoid hard dependency on permissions that may not be seeded in all environments.
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Allow clients to send `type` as a string (e.g., 'mcq','match','fill_blank', 'short_answer','descriptive')
        // Map it to type_id if type_id is missing.
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

        // Resolve subchapter_id from chapter_id + subchapter_number when subchapter_id is not provided.
        // If not found, auto-create a minimal Subchapter for admins to streamline authoring.
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
        $typeId = $this->input('type_id');

        return [
            'type_id'       => ['required','integer','exists:question_types,id'],
            // Curriculum hierarchy - can provide IDs directly or resolve via subchapter
            'grade_id'          => ['nullable','integer','exists:grades,id'],
            'book_id'           => ['nullable','integer','exists:books,id'],
            'chapter_id'        => ['nullable','integer','exists:chapters,id'],
            'subchapter_id'     => ['required_without:subchapter_number','integer','exists:subchapters,id'],
            'subchapter_number' => ['nullable','integer','min:1','required_without:subchapter_id'],
            'difficulty'    => ['nullable', Rule::in(['easy','medium','hard'])],
            'source'        => ['nullable','string','max:150'],
            'book_page'     => ['nullable','integer','min:1'],
            'image_url'     => ['nullable','url','max:2048'],
            'question_text' => ['required','string'],
            'answer_text'   => ['nullable','string'],    // برای descriptive/short_answer

            'is_free'       => ['boolean'],
            'status'        => ['nullable', Rule::in(['draft','published','archived'])],
            'token_price'   => ['nullable','integer','min:0'],

            // MCQ
            'options'               => ['array'],               // [ {label?, text, is_correct}, ... ]
            'options.*.label'       => ['nullable','string','max:10'],
            'options.*.text'        => ['required_with:options','string'],
            'options.*.is_correct'  => ['required_with:options','boolean'],

            // MATCH
            'pairs'                 => ['array'],               // [ {left_text, right_text, match_key?}, ... ]
            'pairs.*.left_text'     => ['required_with:pairs','string'],
            'pairs.*.right_text'    => ['required_with:pairs','string'],
            'pairs.*.match_key'     => ['nullable','string','max:50'],

            // FILL_BLANK
            'blanks'                => ['array'],               // [ {blank_index, correct_text}, ... ]
            'blanks.*.blank_index'  => ['required_with:blanks','integer','min:1'],
            'blanks.*.correct_text' => ['required_with:blanks','string','max:255'],

            // برچسب‌ها
            'tag_ids'               => ['array'],
            'tag_ids.*'             => ['integer','exists:question_tags,id'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function($v){
            // Ensure a valid subchapter is provided; rely on prepareForValidation to resolve/create.
            $subId = $this->input('subchapter_id');
            $chapterId = $this->input('chapter_id');
            $no = $this->input('subchapter_number');
            if (!$subId && !($chapterId && $no)) {
                $v->errors()->add('subchapter_id','Subchapter is required. Provide subchapter_id or (chapter_id + subchapter_number).');
            }

            $type = \App\Models\Question\QuestionType::find($this->type_id)?->name;

            if ($type === 'mcq') {
                if (empty($this->options) || !is_array($this->options)) {
                    $v->errors()->add('options','MCQ requires options.');
                } else {
                    $corrects = collect($this->options)->where('is_correct', true)->count();
                    if ($corrects < 1) {
                        $v->errors()->add('options','At least one option must be correct.');
                    }
                }
            }

            if ($type === 'match' && empty($this->pairs)) {
                $v->errors()->add('pairs','Match question requires pairs.');
            }

            if ($type === 'fill_blank' && empty($this->blanks)) {
                $v->errors()->add('blanks','Fill-blank requires blanks array.');
            }

            if (in_array($type, ['descriptive','short_answer']) && empty($this->answer_text)) {
                $v->errors()->add('answer_text','Answer text is required for this type.');
            }
        });
    }
}
