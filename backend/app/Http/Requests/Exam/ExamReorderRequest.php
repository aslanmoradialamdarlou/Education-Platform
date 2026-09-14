<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Exam\Exam;

class ExamReorderRequest extends FormRequest
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
            'items' => ['required','array','min:1'],
            'items.*.id'    => ['required','integer','exists:exam_questions,id'],
            'items.*.order' => ['required','integer','min:1'],
            'items.*.points'=> ['nullable','numeric','between:0,100'],
        ];
    }
}
