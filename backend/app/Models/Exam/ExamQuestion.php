<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo};

class ExamQuestion extends Model
{
    protected $table = 'exam_questions';

    // این جدول timestamp ندارد
    public $timestamps = false;

    protected $fillable = [
        'exam_id', 'question_id', 'order_number', 'points',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Question\Question::class);
    }
}
