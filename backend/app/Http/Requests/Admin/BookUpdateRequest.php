<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BookUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('catalog.manage') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */

    public function rules(): array
    {
        /** @var \App\Models\Curriculum\Book $book */
        $book = $this->route('book'); // از Route Model Binding می‌آید

        // مقادیر نهایی (مقدار جدید یا مقدار فعلی مدل)
        $subjectId = $this->input('subject_id', $book->subject_id);
        $gradeId   = $this->input('grade_id',   $book->grade_id);
        $year      = $this->input('year',       $book->year);

        return [
            'subject_id' => ['sometimes','integer','exists:subjects,id'],
            'grade_id'   => ['sometimes','integer','exists:grades,id'],
            'title'      => ['sometimes','string','max:150'],
            'year'       => ['sometimes','integer','between:1300,1600'],

            Rule::unique('books')->ignore($book->id)->where(function ($q) use ($subjectId, $gradeId, $year) {
                return $q->where('subject_id', $subjectId)
                    ->where('grade_id',   $gradeId)
                    ->where('year',       $year);
            }),
        ];
    }
}
