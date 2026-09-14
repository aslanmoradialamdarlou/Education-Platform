<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class GradeStoreRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('catalog.manage'); }

    public function rules(): array {
        return ['name' => ['required','string','max:50','unique:grades,name']];
    }
}
