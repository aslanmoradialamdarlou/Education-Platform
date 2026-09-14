<?php
namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamExport extends Model
{
    protected $guarded = [];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
