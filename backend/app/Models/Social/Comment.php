<?php
namespace App\Models\Social;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    protected $guarded = [];

    public function user(): BelongsTo { return $this->belongsTo(\App\Models\User::class); }
}
