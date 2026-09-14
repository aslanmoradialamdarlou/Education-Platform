<?php
namespace App\Models\Content;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphMany};

class Content extends Model
{
    protected $guarded = [];

    public function type(): BelongsTo
    {
        return $this->belongsTo(ContentType::class, 'type_id');
    }

    public function subchapter(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Curriculum\Subchapter::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(MediaFile::class, 'owner_id')->where('owner_type', 'contents');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContentTag::class, 'content_tag_pivot', 'content_id', 'tag_id');
    }

    public function views(): HasMany
    {
        return $this->hasMany(ContentView::class);
    }

    public function videoLicenses(): HasMany
    {
        return $this->hasMany(VideoLicense::class);
    }
}
