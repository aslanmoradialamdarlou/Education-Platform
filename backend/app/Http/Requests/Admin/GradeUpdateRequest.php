<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GradeUpdateRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('catalog.manage'); }

    public function rules(): array {
        return [
            'name' => ['required','string','max:50', Rule::unique('grades','name')->ignore($this->grade?->id)],
        ];
    }
}
