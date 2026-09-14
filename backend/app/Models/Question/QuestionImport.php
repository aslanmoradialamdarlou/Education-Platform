<?php

namespace App\Models\Question;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionImport extends Model
{
    protected $guarded = [];
    protected $casts = [
        'errors_json' => 'array',
        'started_at'  => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function user(): BelongsTo {
        return $this->belongsTo(\App\Models\User::class);
    }
}
