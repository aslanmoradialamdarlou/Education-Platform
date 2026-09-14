<?php
namespace App\Models\Curriculum;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Book extends Model
{
    protected $guarded = [];

    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function grade(): BelongsTo   { return $this->belongsTo(Grade::class); }
    public function chapters(): HasMany  { return $this->hasMany(Chapter::class); }
}
