<?php
namespace App\Models\Curriculum;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Subchapter extends Model
{
    protected $guarded = [];

    public function chapter(): BelongsTo { return $this->belongsTo(Chapter::class); }
    public function contents(): HasMany  { return $this->hasMany(\App\Models\Content\Content::class); }
}
