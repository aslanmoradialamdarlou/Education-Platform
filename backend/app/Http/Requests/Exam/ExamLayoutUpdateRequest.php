<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Exam\Exam;

class ExamLayoutUpdateRequest extends FormRequest
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
            'paper_size'   => ['nullable','in:a4,a5,letter,legal'],
            'orientation'  => ['nullable','in:portrait,landscape'],
            'font_family'  => ['nullable','string','max:50'],
            'font_size'    => ['nullable','integer','between:8,24'],
            'numbering'    => ['nullable','in:1.,1),۱.,۱),الف),none'],
            'line_spacing' => ['nullable','numeric','between:1,3'],
            'show_logo'    => ['nullable','boolean'],
            'header_html'  => ['nullable','string'],
            'footer_html'  => ['nullable','string'],
            'with_answers' => ['nullable','boolean'],
        ];
    }
}
