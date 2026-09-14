<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class HeaderTemplateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') || $this->user()?->can('exam.templates.manage');
    }

    public function rules(): array
    {
        return [
            'name'                  => ['required','string','max:150'],
            'template_header_html'  => ['nullable','string'],
            'template_footer_html'  => ['nullable','string'],
            'meta'                  => ['nullable','array'],   // {logo_url, watermark, ...}
        ];
    }
}
