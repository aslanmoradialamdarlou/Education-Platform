<?php
namespace App\Models\Blog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BlogComment extends Model
{
    protected $table = 'blog_comments';
    protected $guarded = [];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(BlogPost::class, 'post_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(BlogComment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(BlogComment::class, 'parent_id')
                    ->with('replies') // Recursively load nested replies
                    ->with('author:id,name')
                    ->where('status', 'approved')
                    ->orderBy('created_at', 'asc');
    }

    // Scope for top-level comments only
    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    // Scope for approved comments
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}

