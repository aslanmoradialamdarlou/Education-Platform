<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class ExamStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user(); // فقط لاگین
    }

    public function rules(): array
    {
        return [
            'title' => ['required','string','max:200'],
            'header_template_id' => ['nullable','integer','exists:header_templates,id'],
            'layout' => ['sometimes','array'],
            'layout.paper_size'  => ['sometimes','in:a4,a5,letter,legal'],
            'layout.orientation' => ['sometimes','in:portrait,landscape'],
            'layout.font_family' => ['sometimes','string','max:50'],
            'layout.font_size'   => ['sometimes','integer','between:8,24'],
            'layout.numbering'   => ['sometimes','string','max:10'], // مثل "1." یا "(1)"
        ];
    }
}
