<?php

namespace App\Models\Commerce;

use App\Models\Billing\SubscriptionPlan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $table = 'order_items';
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = [
        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }

    /* فقط وقتی item_type='plan' استفاده کن */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'item_id');
    }
}
