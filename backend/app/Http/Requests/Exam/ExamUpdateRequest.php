<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Exam\Exam;

class ExamUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Exam $exam */
        $exam = $this->route('exam');
        return $exam && $this->user() && $exam->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes','string','max:200'],
            'header_template_id' => ['sometimes','nullable','integer','exists:header_templates,id'],
            'layout' => ['sometimes','array'],
            'layout.paper_size'  => ['sometimes','in:a4,a5,letter,legal'],
            'layout.orientation' => ['sometimes','in:portrait,landscape'],
            'layout.font_family' => ['sometimes','string','max:50'],
            'layout.font_size'   => ['sometimes','integer','between:8,24'],
            'layout.numbering'   => ['sometimes','string','max:10'],
        ];
    }
}
