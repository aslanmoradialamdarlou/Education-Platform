<?php
namespace App\Models\Blog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Rating extends Model
{
    protected $table = 'ratings';
    protected $guarded = [];

    public function rateable(): MorphTo
    {
        return $this->morphTo(); // ستون‌ها: rateable_type, rateable_id
    }
}
