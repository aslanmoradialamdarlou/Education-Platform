<?php

namespace App\Models\Question;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionAsset extends Model
{
    protected $table = 'question_assets';
    protected $guarded = [];
    protected $casts = ['meta' => 'array'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
