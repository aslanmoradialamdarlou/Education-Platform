<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BlogPostStoreRequest;
use App\Http\Requests\Admin\BlogPostUpdateRequest;
use App\Http\Resources\Admin\BlogPostResource;
use App\Models\Blog\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogPostController extends Controller
{
    public function __construct()
    {
        // Accept both canonical 'admin' and legacy/alternate 'Administrator' role names
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
        // یا پرمیژن‌ها:
        // $this->middleware('permission:blog.manage');
    }

    public function index(Request $r)
    {
        $q = BlogPost::query();

        // فیلترها
        if ($search = $r->query('q')) {
            $q->where(function($qq) use ($search) {
                $qq->where('title','like',"%{$search}%")
                    ->orWhere('slug','like',"%{$search}%")
                    ->orWhere('content','like',"%{$search}%");
            });
        }
        if ($status = $r->query('status')) {
            $q->where('status', $status); // draft|published|archived
        }
        if ($authorId = $r->query('author_id')) {
            $q->where('author_id', $authorId);
        }
        if ($categoryId = $r->query('category_id')) {
            $q->whereHas('categories', fn($qq) => $qq->where('id',$categoryId));
        }
        if ($pinned = $r->query('pinned')) {
            $q->where('is_pinned', (int)filter_var($pinned, FILTER_VALIDATE_BOOLEAN));
        }
        if ($from = $r->query('date_from')) {
            $q->whereDate('published_at','>=',$from);
        }
        if ($to = $r->query('date_to')) {
            $q->whereDate('published_at','<=',$to);
        }

        // سورت
        $sort = $r->query('sort','-id'); // -id, published_at, -published_at, title, -title, pinned
        $q = $this->applySort($q, $sort);

        $q->with(['author','categories'])->withCount(['comments','likes']);

        $perPage = $r->integer('per_page', $r->integer('per', 20));
        $posts = $q->paginate($perPage);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Posts list',
            'data'    => BlogPostResource::collection($posts),
            'meta'    => [
                'current_page' => $posts->currentPage(),
                'per_page'     => $posts->perPage(),
                'total'        => $posts->total(),
            ],
        ]);
    }

    public function store(BlogPostStoreRequest $req)
    {
        $data = $req->validated();

        $slug = $data['slug'] ?? Str::slug($data['title']);
        $slug = $this->uniqueSlug($slug);

        // determine author id from the request user (middleware guarantees auth)
        $user = $req->user();
        $authorId = null;
        if ($user) {
            if (method_exists($user, 'getKey')) {
                $authorId = $user->getKey();
            } elseif (isset($user->id)) {
                $authorId = $user->id;
            }
        }

        $post = BlogPost::create([
            'title'            => $data['title'],
            'slug'             => $slug,
            'content'          => $data['content'],
            'excerpt'          => $data['excerpt'] ?? null,
            'cover_image_url'  => $data['cover_image_url'] ?? null,
            'meta_title'       => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'meta_keywords'    => $data['meta_keywords'] ?? null,
            'canonical_url'    => $data['canonical_url'] ?? null,
            'reading_time'     => $this->estimateReadingTime($data['content']),
            'is_pinned'        => (bool)($data['is_pinned'] ?? false),
            'status'           => $data['status'], // draft|published|archived
            'published_at'     => $data['published_at'] ?? null,
            // use the request user id (middleware ensures an authenticated admin)
            'author_id'        => $authorId,
        ]);

        if (!empty($data['category_ids'])) {
            $post->categories()->sync($data['category_ids']);
        }

        $post->load(['author','categories'])->loadCount(['comments','likes']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog post created',
            'data'    => new BlogPostResource($post),
        ], 201);
    }

    public function show(BlogPost $blog_post)
    {
        $blog_post->load(['author','categories'])->loadCount(['comments','likes']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog post detail',
            'data'    => new BlogPostResource($blog_post),
        ]);
    }

    public function update(BlogPostUpdateRequest $req, BlogPost $blog_post)
    {
        $data = $req->validated();

        $slug = $data['slug'] ?? Str::slug($data['title'] ?? $blog_post->title);
        $slug = $this->uniqueSlug($slug, $blog_post->id);

        // Normalize explicit empty cover to null when client intends to remove it
        if (array_key_exists('cover_image_url', $data) && $data['cover_image_url'] === '') {
            $data['cover_image_url'] = null;
        }

        $blog_post->fill([
            'title'            => $data['title'] ?? $blog_post->title,
            'slug'             => $slug,
            'content'          => $data['content'] ?? $blog_post->content,
            'excerpt'          => $data['excerpt'] ?? $blog_post->excerpt,
            // Allow explicit null to clear the cover when key is present
            'cover_image_url'  => array_key_exists('cover_image_url', $data) ? $data['cover_image_url'] : $blog_post->cover_image_url,
            'meta_title'       => $data['meta_title'] ?? $blog_post->meta_title,
            'meta_description' => $data['meta_description'] ?? $blog_post->meta_description,
            'meta_keywords'    => $data['meta_keywords'] ?? $blog_post->meta_keywords,
            'canonical_url'    => $data['canonical_url'] ?? $blog_post->canonical_url,
            'is_pinned'        => $data['is_pinned'] ?? $blog_post->is_pinned,
            'status'           => $data['status'] ?? $blog_post->status,
            'published_at'     => array_key_exists('published_at',$data) ? $data['published_at'] : $blog_post->published_at,
        ]);

        // اگر محتوا تغییر کرد، reading_time رو آپدیت کن
        if (array_key_exists('content',$data)) {
            $blog_post->reading_time = $this->estimateReadingTime($blog_post->content);
        }

        $blog_post->save();

        if (array_key_exists('category_ids', $data)) {
            $blog_post->categories()->sync($data['category_ids'] ?? []);
        }

        $blog_post->load(['author','categories'])->loadCount(['comments','likes']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog post updated',
            'data'    => new BlogPostResource($blog_post),
        ]);
    }

    public function destroy(BlogPost $blog_post)
    {
        // اگر سیاست حذف سختگیرانه می‌خوای، اینجا چک کن (مثلاً اگر published است، اجازه نده)
        $blog_post->delete();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog post deleted',
            'data'    => null,
        ]);
    }

    public function publish(BlogPost $blog_post)
    {
        $blog_post->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog post published',
            'data'    => new BlogPostResource($blog_post),
        ]);
    }

    public function archive(BlogPost $blog_post)
    {
        $blog_post->update([
            'status' => 'archived',
        ]);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog post archived',
            'data'    => new BlogPostResource($blog_post),
        ]);
    }

    public function checkSlug(Request $r)
    {
        $r->validate([
            'slug' => ['required','string','max:220'],
            'ignore_id' => ['nullable','integer'],
        ]);
        $slug = Str::slug($r->slug);
        $isTaken = BlogPost::where('slug', $slug)
            ->when($r->filled('ignore_id'), fn($q)=>$q->where('id','!=',$r->integer('ignore_id')))
            ->exists();

        if ($isTaken) {
            $slug = $this->uniqueSlug($slug, $r->integer('ignore_id'));
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Slug checked',
            'data'    => [
                'available' => !$isTaken,
                'suggestion'=> $slug,
            ],
        ]);
    }

    private function applySort($q, string $sort)
    {
        return match ($sort) {
            'id'            => $q->orderBy('id'),
            '-id'           => $q->orderByDesc('id'),
            'title'         => $q->orderBy('title'),
            '-title'        => $q->orderByDesc('title'),
            'published_at'  => $q->orderBy('published_at'),
            '-published_at' => $q->orderByDesc('published_at'),
            'pinned'        => $q->orderByDesc('is_pinned')->orderByDesc('published_at'),
            default         => $q->orderByDesc('id'),
        };
    }

    private function estimateReadingTime(string $markdown): int
    {
        // ساده: کلمات / 200
        $plain = strip_tags($markdown);
        $words = str_word_count(mb_convert_encoding($plain, 'UTF-8'));
        return max(1, (int) ceil($words / 200));
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = $base ?: 'post';
        $i = 2;
        $exists = function($s) use ($ignoreId) {
            $q = BlogPost::where('slug', $s);
            if ($ignoreId) $q->where('id','!=',$ignoreId);
            return $q->exists();
        };

        while ($exists($slug)) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
