<?php

namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Wallet extends Model
{
    protected $table = 'wallets';
    public $timestamps = false;
    protected $guarded = [];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function transactions(): HasMany { return $this->hasMany(WalletTransaction::class, 'wallet_id'); }
}
