<?php
namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class ExamAddQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $exam = $this->route('exam');
        return $exam && $this->user() && $exam->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'question_id' => ['required','integer','exists:questions,id'],
            'points'      => ['nullable','numeric','between:0,100'],
        ];
    }
}
