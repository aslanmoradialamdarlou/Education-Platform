<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class QuestionBrowseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // عمومی است؛ دسترسی پلن در کنترلر اِعمال می‌شود
    }

    public function rules(): array
    {
        return [
            'q'            => ['nullable','string','max:200'],
            'type'         => ['nullable'], // int یا string or array
            'types'        => ['nullable','array'], // Support multiple types
            'types.*'      => ['string'],
            'difficulty'   => ['nullable','in:easy,medium,hard'],
            'difficulties' => ['nullable','array'], // Support multiple difficulties
            'difficulties.*' => ['in:easy,medium,hard'],
            'source'       => ['nullable','string','max:150'],

            'page_no'      => ['nullable','integer','min:1','max:1000'],
            'page_from'    => ['nullable','integer','min:1','max:1000'],
            'page_to'      => ['nullable','integer','min:1','max:1000'],

            'free'         => ['nullable','boolean'],

            'grade_id'     => ['nullable','integer','exists:grades,id'],
            'grade_ids'    => ['nullable','array'], // Support multiple grades
            'grade_ids.*'  => ['integer','exists:grades,id'],
            'book_id'      => ['nullable','integer','exists:books,id'],
            'chapter_id'   => ['nullable','integer','exists:chapters,id'],
            'chapter_ids'  => ['nullable','array'], // Support multiple chapters
            'chapter_ids.*'=> ['integer','exists:chapters,id'],
            'subchapter_id'=> ['nullable','integer','exists:subchapters,id'],

            'tags'         => ['nullable','array'],
            'tags.*'       => ['string','max:120'],

            // سورت و صفحه‌بندی
            'sort'         => ['nullable','in:newest,oldest,page_asc,page_desc,difficulty_asc,difficulty_desc'],
            'per_page'     => ['nullable','integer','min:1','max:100'],
        ];
    }
}
