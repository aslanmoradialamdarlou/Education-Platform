<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BookStoreRequest extends FormRequest
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
        return [
            'subject_id' => ['required','integer','exists:subjects,id'],
            'grade_id'   => ['required','integer','exists:grades,id'],
            'title'      => ['required','string','max:150'],
            'year'       => ['required','integer','between:1300,1600'],

            Rule::unique('books')->where(function ($q) {
                return $q->where('subject_id', $this->input('subject_id'))
                    ->where('grade_id',   $this->input('grade_id'))
                    ->where('year',       $this->input('year'));
            }),
        ];
    }

    public function messages(): array
    {
        return [
            'subject_id.required' => 'subject_id الزامی است.',
            'grade_id.required'   => 'grade_id الزامی است.',
            'year.required'       => 'year الزامی است.',
            'books_unique'        => 'کتابی با همین (درس/پایه/سال) از قبل وجود دارد.',
        ];
    }

}
