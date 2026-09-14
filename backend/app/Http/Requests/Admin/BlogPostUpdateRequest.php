<?php

namespace App\Http\Requests\Admin;

use App\Models\Blog\BlogPost;
use Illuminate\Foundation\Http\FormRequest;

class BlogPostUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Rely on route middleware (auth + role) for authorization to avoid duplicate 403s
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        $post = $this->route('blog_post');
        $id = is_object($post) ? $post->id : null;
        $slugRule = 'nullable|string|max:220|unique:blog_posts,slug' . ($id ? ',' . $id : '');
        return [
            'title'            => ['sometimes','string','max:200'],
            'slug'             => [$slugRule],
            'content'          => ['sometimes','string'],
            'excerpt'          => ['nullable','string','max:300'],
            'cover_image_url'  => ['nullable','url','max:500'],
            'meta_title'       => ['nullable','string','max:255'],
            'meta_description' => ['nullable','string','max:300'],
            'meta_keywords'    => ['nullable','array'],
            'meta_keywords.*'  => ['string','max:50'],
            'canonical_url'    => ['nullable','url','max:500'],
            'is_pinned'        => ['sometimes','boolean'],
            'status'           => ['sometimes','in:draft,published,archived'],
            'published_at'     => ['nullable','date'],
            'category_ids'     => ['nullable','array'],
            'category_ids.*'   => ['integer','exists:blog_categories,id'],
        ];
    }
}
