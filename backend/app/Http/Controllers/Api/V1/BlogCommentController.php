<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Blog\BlogComment;
use App\Models\Blog\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlogCommentController extends Controller
{
    /**
     * Get all comments for a blog post (with nested replies)
     */
    public function index(BlogPost $post)
    {
        $comments = BlogComment::where('post_id', $post->id)
            ->topLevel() // Only top-level comments
            ->approved()
            ->with(['author:id,name', 'replies'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform to match frontend expectations
        $formattedComments = $comments->map(function ($comment) {
            return $this->formatComment($comment);
        });

        return response()->json([
            'code' => 'OK',
            'message' => 'Comments retrieved successfully',
            'data' => [
                'items' => $formattedComments,
                'totalTopLevel' => $comments->count(),
                'totalAll' => $this->countAllComments($comments),
                'page' => 1,
                'pageSize' => 1000,
                'hasMore' => false
            ]
        ]);
    }

    /**
     * Store a new comment (or reply)
     */
    public function store(Request $request, BlogPost $post)
    {
        $validated = $request->validate([
            'text' => 'required|string|max:5000',
            'parentId' => 'nullable|exists:blog_comments,id'
        ]);

        // Get user (if authenticated) or allow guest comments
        $userId = Auth::id();

        $comment = BlogComment::create([
            'post_id' => $post->id,
            'user_id' => $userId,
            'parent_id' => $validated['parentId'] ?? null,
            'body' => $validated['text'],
            'status' => 'approved', // Auto-approve for now, can add moderation later
        ]);

        // Load relationships
        $comment->load('author:id,name');

        return response()->json([
            'code' => 'OK',
            'message' => 'Comment created successfully',
            'data' => $this->formatComment($comment)
        ], 201);
    }

    /**
     * Update a comment (only by owner)
     */
    public function update(Request $request, BlogPost $post, BlogComment $comment)
    {
        // Authorization: only comment owner can update
        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'code' => 'FORBIDDEN',
                'message' => 'You can only edit your own comments'
            ], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string|max:5000'
        ]);

        $comment->update([
            'body' => $validated['text']
        ]);

        $comment->load('author:id,name');

        return response()->json([
            'code' => 'OK',
            'message' => 'Comment updated successfully',
            'data' => $this->formatComment($comment)
        ]);
    }

    /**
     * Delete a comment (only by owner)
     */
    public function destroy(BlogPost $post, BlogComment $comment)
    {
        // Authorization: only comment owner can delete
        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'code' => 'FORBIDDEN',
                'message' => 'You can only delete your own comments'
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Comment deleted successfully',
            'data' => ['id' => $comment->id]
        ]);
    }

    /**
     * Format comment for frontend (recursive for replies)
     */
    private function formatComment($comment)
    {
        return [
            'id' => $comment->id,
            'text' => $comment->body,
            'author' => $comment->author->name ?? 'کاربر مهمان',
            'avatar' => 'https://i.pravatar.cc/150?u=' . ($comment->user_id ?? 'guest'),
            'time' => $comment->created_at->diffForHumans(),
            'createdAt' => $comment->created_at->toISOString(),
            'replies' => $comment->replies ? $comment->replies->map(function ($reply) {
                return $this->formatComment($reply);
            })->toArray() : []
        ];
    }

    /**
     * Count all comments including nested replies
     */
    private function countAllComments($comments)
    {
        $total = $comments->count();
        foreach ($comments as $comment) {
            if ($comment->replies) {
                $total += $this->countAllComments($comment->replies);
            }
        }
        return $total;
    }
}
