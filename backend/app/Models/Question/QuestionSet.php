<?php

namespace App\Models\Question;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class QuestionSet extends Model
{
    protected $table = 'user_question_sets';
    
    protected $fillable = [
        'user_id',
        'name',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the question set.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all questions in this set.
     */
    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'question_set_items', 'question_set_id', 'question_id')
            ->withPivot('order', 'created_at')
            ->orderByPivot('order');
    }

    /**
     * Get count of questions in this set.
     */
    public function getQuestionsCountAttribute(): int
    {
        return $this->questions()->count();
    }
}
