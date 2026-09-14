<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Blog\BlogPost;
use App\Models\Blog\BlogComment;
use App\Models\Support\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;


class BlogController extends Controller
{
    public function latest()
    {
        $items = BlogPost::query()
            ->where('status','published')
            ->orderByDesc('published_at')
            ->limit(4)
            ->get(['id','title','slug','published_at','cover_image_url']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Latest blog posts',
            'data'    => $items->map(fn($p) => [
                'id'    => $p->id,
                'title' => $p->title,
                'slug'  => $p->slug,
                'url'   => "/blogs/{$p->id}",
                'date'  => optional($p->published_at)->toDateString(),
                'cover_image_url' => $p->cover_image_url,
            ]),
        ]);
    }

    public function index(Request $r)
    {
        $q = BlogPost::query()->where('status','published');

        if ($search = $r->query('q')) {
            $q->where('title','like',"%{$search}%");
        }

        $per = (int) $r->query('per_page', 12);
        $posts = $q->orderByDesc('published_at')
            ->paginate($per, ['id','title','slug','published_at','cover_image_url']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog list',
            'data'    => $posts->getCollection()->map(fn($p) => [
                'id'    => $p->id,
                'title' => $p->title,
                'slug'  => $p->slug,
                'url'   => "/blogs/{$p->id}",
                'date'  => optional($p->published_at)->toDateString(),
                'cover_image_url' => $p->cover_image_url,
            ]),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'per_page'     => $posts->perPage(),
                'total'        => $posts->total(),
                'last_page'    => $posts->lastPage(),
            ],
        ]);
    }

    /**
     * Display a single blog post by slug or ID.
     */
    public function show($slugOrId)
    {
        $post = BlogPost::query()
            ->where('status', 'published')
            ->where(function ($q) use ($slugOrId) {
                // Try to find by slug first, then by ID
                $q->where('slug', $slugOrId)
                  ->orWhere('id', $slugOrId);
            })
            ->first();

        if (!$post) {
            return response()->json([
                'code'    => 'NOT_FOUND',
                'message' => 'Blog post not found',
            ], 404);
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Blog post details',
            'data'    => [
                'id'           => $post->id,
                'title'        => $post->title,
                'slug'         => $post->slug,
                'content'      => $post->content,
                'markdown'     => $post->content, // Add markdown field for LaTeX/math support
                'author'       => $post->author->name ?? 'Unknown',
                'author_id'    => $post->author_id,
                'date'         => optional($post->published_at)->toDateString(),
                'published_at' => $post->published_at,
                'created_at'   => $post->created_at,
                'updated_at'   => $post->updated_at,
            ],
        ]);
    }

    /**
     * Report a blog comment - creates a support ticket for the user
     */
    public function reportComment(Request $request, $commentId)
    {
        $request->validate([
            'reason' => 'required|string|in:spam,inappropriate,harassment,misinformation,other',
            'details' => 'nullable|string|max:1000',
        ]);

        // Find the comment
        $comment = BlogComment::find($commentId);
        if (!$comment) {
            return response()->json([
                'code' => 'NOT_FOUND',
                'message' => 'نظر مورد نظر یافت نشد',
            ], 404);
        }

        // Get the authenticated user
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'code' => 'UNAUTHORIZED',
                'message' => 'لطفا ابتدا وارد شوید',
            ], 401);
        }

        // Create a ticket for this report
        $reasonLabels = [
            'spam' => 'اسپم',
            'inappropriate' => 'محتوای نامناسب',
            'harassment' => 'آزار و اذیت',
            'misinformation' => 'اطلاعات نادرست',
            'other' => 'سایر',
        ];

        $reasonLabel = $reasonLabels[$request->reason] ?? 'سایر';
        $subject = "گزارش نظر - {$reasonLabel}";

        // Generate unique ticket code
        $code = 'T-' . strtoupper(Str::random(8));
        while (Ticket::where('code', $code)->exists()) {
            $code = 'T-' . strtoupper(Str::random(8));
        }

        // Get the blog post for context
        $blogPost = $comment->post;

        // Create ticket
        $ticket = Ticket::create([
            'code' => $code,
            'user_id' => $user->id,
            'subject' => $subject,
            'status' => 'open',
            'priority' => 'low',
            'source' => 'web',
            'last_activity_at' => now(),
            'unread_for_support' => 1,
            'unread_for_user' => 0,
            'meta' => json_encode([
                'type' => 'comment_report',
                'comment_id' => $comment->id,
                'blog_post_id' => $blogPost?->id,
                'blog_post_title' => $blogPost?->title,
                'reason' => $request->reason,
                'reason_label' => $reasonLabel,
                'comment_author' => $comment->user->name ?? 'کاربر حذف شده',
                'comment_text' => Str::limit($comment->text, 200),
            ]),
        ]);

        // Create first ticket message with details
        $messageBody = "گزارش نظر در مطلب: " . ($blogPost?->title ?? 'نامشخص') . "\n\n";
        $messageBody .= "دلیل گزارش: {$reasonLabel}\n\n";
        if ($request->details) {
            $messageBody .= "توضیحات: {$request->details}\n\n";
        }
        $messageBody .= "متن نظر: \n{$comment->text}\n\n";
        $messageBody .= "نویسنده نظر: " . ($comment->user->name ?? 'کاربر حذف شده');

        $ticket->messages()->create([
            'sender_user_id' => $user->id,
            'sender_role' => 'user',
            'is_internal_note' => false,
            'body' => $messageBody,
            'read_by_user' => true,
            'read_by_support' => false,
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'گزارش شما با موفقیت ثبت شد و به تیم پشتیبانی ارسال گردید',
            'data' => [
                'ticket_code' => $ticket->code,
                'ticket_id' => $ticket->id,
            ],
        ]);
    }
}

