<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Curriculum\Chapter;

class ChapterUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('catalog.manage') ?? false;
    }

    public function rules(): array
    {
        /** @var Chapter $chapter */
        $chapter = $this->route('chapter'); // از Route Model Binding

        return [
            'book_id' => ['sometimes','integer','exists:books,id'],
            'number'  => [
                'sometimes','integer','between:1,200',
                // یکتا داخل هر کتاب
                Rule::unique('chapters', 'number')
                    ->ignore($chapter?->id)
                    ->where(fn($q) => $q->where('book_id', $this->input('book_id', $chapter?->book_id))),
            ],
            'title'      => ['sometimes','string','max:150'],
            'start_page' => ['nullable','integer','min:1'],
            'end_page'   => ['nullable','integer','min:1','gte:start_page'],
        ];
    }
}
