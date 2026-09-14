<?php
namespace App\Models\Curriculum;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Chapter extends Model
{
    protected $guarded = [];
    
    protected $casts = [
        'start_page' => 'integer',
        'end_page' => 'integer',
    ];

    public function book(): BelongsTo       { return $this->belongsTo(Book::class); }
    public function subchapters(): HasMany  { return $this->hasMany(Subchapter::class); }
}
