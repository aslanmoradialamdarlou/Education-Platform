<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BlogCategoryUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('blog.manage') ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('blog_category')?->id ?? $this->route('category')?->id ?? null;

        return [
            'name' => ['required','string','max:100'],
            'slug' => ['nullable','string','max:120','unique:blog_categories,slug,'.$id],
        ];
    }
}
