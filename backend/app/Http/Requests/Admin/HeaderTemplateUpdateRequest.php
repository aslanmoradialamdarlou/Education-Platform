<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class HeaderTemplateUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') || $this->user()?->can('exam.templates.manage');
    }

    public function rules(): array
    {
        return [
            'name'                  => ['sometimes','string','max:150'],
            'template_header_html'  => ['sometimes','nullable','string'],
            'template_footer_html'  => ['sometimes','nullable','string'],
            'meta'                  => ['sometimes','nullable','array'],
        ];
    }
}
