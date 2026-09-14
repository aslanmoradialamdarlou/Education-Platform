<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $table = 'wallet_transactions';
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = [
        'amount'     => 'decimal:2',
        'meta'       => 'array',
        'created_at' => 'datetime',
    ];

    public function wallet(): BelongsTo { return $this->belongsTo(Wallet::class); }
}
