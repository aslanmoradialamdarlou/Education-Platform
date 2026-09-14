<?php
namespace App\Models\Curriculum;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grade extends Model
{
    protected $guarded = [];
    public $timestamps = false;

    protected $fillable = ['name'];

    public function books(): HasMany
    {
        return $this->hasMany(Book::class, 'grade_id');
    }
}
