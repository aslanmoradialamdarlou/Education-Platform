<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BlogPostStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by route middleware (auth + role). Return true here
        // to avoid duplicate 403s from FormRequest when middleware already enforces access.
        return true;
    }
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'title'            => ['required','string','max:200'],
            'slug'             => ['nullable','string','max:220','unique:blog_posts,slug'],
            'content'          => ['required','string'],
            'excerpt'          => ['nullable','string','max:300'],
            'cover_image_url'  => ['nullable','url','max:500'],
            'meta_title'       => ['nullable','string','max:255'],
            'meta_description' => ['nullable','string','max:300'],
            'meta_keywords'    => ['nullable','array'],
            'meta_keywords.*'  => ['string','max:50'],
            'canonical_url'    => ['nullable','url','max:500'],
            'is_pinned'        => ['boolean'],
            'status'           => ['required','in:draft,published,archived'],
            'published_at'     => ['nullable','date'],
            'category_ids'     => ['nullable','array'],
            'category_ids.*'   => ['integer','exists:blog_categories,id'],
        ];
    }
}
