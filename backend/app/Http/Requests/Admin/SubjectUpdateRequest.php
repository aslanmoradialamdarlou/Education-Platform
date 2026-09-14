<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        $id = $this->route('subject')?->id ?? null;

        return [
            'name' => [
                'required','string','max:100',
                Rule::unique('subjects','name')->ignore($id),
            ],
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'نام درس'];
    }
}
