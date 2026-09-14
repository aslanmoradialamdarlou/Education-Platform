<?php

namespace App\Models\Question;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class QuestionTag extends Model
{
    protected $table = 'question_tags';
    protected $guarded = [];


    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'question_tag_pivot', 'tag_id', 'question_id');
    }
}
