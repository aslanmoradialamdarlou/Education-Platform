<?php
namespace App\Models\Blog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, BelongsToMany, HasMany};

class BlogPost extends Model
{
    protected $table = 'blog_posts';
    protected $guarded = [];

    protected $casts = [
        'published_at' => 'datetime',
        'is_pinned'    => 'boolean',
    ];


    public function author(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'author_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            BlogCategory::class,
            'blog_category_post',
            'blog_post_id',
            'blog_category_id'
        );
    }

    public function comments(): HasMany
    {
        return $this->hasMany(BlogComment::class, 'post_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(BlogLike::class, 'post_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            BlogTag::class,
            'blog_post_tag',
            'blog_post_id',
            'blog_tag_id'
        );
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(BlogPostRevision::class, 'post_id');
    }
}
