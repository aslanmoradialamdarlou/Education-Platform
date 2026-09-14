<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class ImportBatch extends Model
{
    protected $guarded = [];
    protected $casts = [
        'meta' => 'array',
    ];

    public function errors()
    {
        return $this->hasMany(ImportError::class, 'batch_id');
    }
}
