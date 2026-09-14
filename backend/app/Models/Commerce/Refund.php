<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Refund extends Model
{
    protected $table = 'refunds';
    protected $guarded = [];

    protected $casts = [
        'amount'      => 'decimal:2',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
}
