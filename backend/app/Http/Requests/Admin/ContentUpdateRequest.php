<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ContentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }
        if (method_exists($user, 'hasAnyRole')) {
            return (bool) $user->hasAnyRole(['admin','Administrator']);
        }
        return false;
    }

    public function rules(): array
    {
        return [
            'type_id'       => ['sometimes','integer','exists:content_types,id'],
            'subchapter_id' => ['nullable','integer','exists:subchapters,id'],
            'title'         => ['sometimes','string','max:200'],
            'description'   => ['nullable','string'],
            'is_free'       => ['sometimes','boolean'],
            'token_price'   => ['nullable','integer','min:0'],
            'pdf_file'      => ['nullable','file','mimes:pdf','max:20480'], // max 20MB
        ];
    }
}
