<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BlogCategoryStoreRequest;
use App\Http\Requests\Admin\BlogCategoryUpdateRequest;
use App\Http\Resources\Admin\BlogCategoryResource;
use App\Models\Blog\BlogCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogCategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','permission:blog.manage']);
    }

    public function index(Request $r)
    {
        $q = BlogCategory::query();

        if ($search = $r->query('q')) {
            $q->where(function($qq) use ($search) {
                $qq->where('name','like',"%{$search}%")
                    ->orWhere('slug','like',"%{$search}%");
            });
        }

        $q->withCount('posts')->orderByDesc('id');

        $perPage = $r->integer('per_page', $r->integer('per', 20));
        $cats = $q->paginate($perPage);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Categories list',
            'data'    => BlogCategoryResource::collection($cats),
            'meta'    => [
                'current_page' => $cats->currentPage(),
                'per_page'     => $cats->perPage(),
                'total'        => $cats->total(),
            ],
        ]);
    }

    public function store(BlogCategoryStoreRequest $req)
    {
        $data = $req->validated();
        if (empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug(Str::slug($data['name']));
        }

        $cat = BlogCategory::create($data);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Category created',
            'data'    => new BlogCategoryResource($cat),
        ], 201);
    }

    public function show(BlogCategory $blog_category)
    {
        $blog_category->loadCount('posts');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Category detail',
            'data'    => new BlogCategoryResource($blog_category),
        ]);
    }

    public function update(BlogCategoryUpdateRequest $req, BlogCategory $blog_category)
    {
        $data = $req->validated();

        if (empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug(Str::slug($data['name']), $blog_category->id);
        }

        $blog_category->update($data);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Category updated',
            'data'    => new BlogCategoryResource($blog_category),
        ]);
    }

    public function destroy(BlogCategory $blog_category)
    {
        if ($blog_category->posts()->exists()) {
            return response()->json([
                'code'    => 'CONFLICT',
                'message' => 'Category has related posts',
                'data'    => null,
            ], 409);
        }

        $blog_category->delete();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Category deleted',
            'data'    => null,
        ]);
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = $base ?: 'category';
        $i = 2;
        $exists = function($s) use ($ignoreId) {
            $q = BlogCategory::where('slug', $s);
            if ($ignoreId) $q->where('id','!=',$ignoreId);
            return $q->exists();
        };

        while ($exists($slug)) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
