<?php
namespace App\Models\Question;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionType extends Model
{
    protected $table = 'question_types';
    public $timestamps = false;
    protected $guarded = [];

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'type_id');
    }
}
