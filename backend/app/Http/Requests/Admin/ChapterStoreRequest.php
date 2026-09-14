<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ChapterStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'book_id'    => ['required','integer','exists:books,id'],
            'number'     => ['required','integer','between:1,200'],
            'title'      => ['required','string','max:150'],
            'start_page' => ['nullable','integer','min:1'],
            'end_page'   => ['nullable','integer','min:1','gte:start_page'],
        ];
    }
}
