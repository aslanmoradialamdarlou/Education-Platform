<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class QuestionImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') || $this->user()?->can('questions.create') || $this->user()?->can('catalog.manage');
    }

    public function rules(): array
    {
        return [
            'file'     => ['required','file','mimetypes:text/plain,text/csv,text/tsv','max:20480'], // تا 20MB
            'dry_run'  => ['sometimes','boolean'], // فقط اعتبارسنجی، بدون درج
            // رفتارهای دلخواه:
            'delimiter'=> ['sometimes','in:comma,semicolon,tab'], // پیش‌فرض comma
            'encoding' => ['sometimes','in:utf8,latin1'],
        ];
    }
}
