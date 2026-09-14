<?php
namespace App\Models\Commerce;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, HasOne};

class Order extends Model
{
    protected $table = 'orders';
    protected $guarded = [];

    protected $casts = [
        'paid_at' => 'datetime',
        'meta'    => 'array',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    public function items(): HasMany { return $this->hasMany(OrderItem::class, 'order_id'); }

    public function transactions(): HasMany { return $this->hasMany(Transaction::class, 'order_id'); }

    public function latestTransaction(): HasOne
    {
        return $this->hasOne(Transaction::class, 'order_id')->latestOfMany();
    }

    public function refundables(): HasMany { return $this->hasMany(Refund::class, 'order_id'); }

    public function couponRedemption(): HasOne
    {
        return $this->hasOne(CouponRedemption::class, 'order_id');
    }

}
