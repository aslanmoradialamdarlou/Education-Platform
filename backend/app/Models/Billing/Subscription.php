<?php

namespace App\Models\Billing;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};
use Illuminate\Database\Eloquent\Builder;

class Subscription extends Model
{
    protected $table = 'subscriptions';
    protected $guarded = [];
    public $timestamps = false;
    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(SubscriptionEvent::class, 'subscription_id');
    }

    /** فقط وضعیت active؛ بدون تاریخ */
    public function scopeActiveStatus(Builder $q): Builder
    {
        return $q->where('status', 'active');
    }

    /** اکتیو در بازهٔ تاریخ امروز */
    public function scopeInWindow(Builder $q): Builder
    {
        $today = now()->toDateString();
        return $q->whereDate('start_date','<=',$today)
            ->whereDate('end_date','>=',$today);
    }

    /** اکتیو کامل (وضعیت + بازه) */
    public function scopeActive($q)
    {
        return $q->where('status', 'active')
            ->whereDate('start_date', '<=', now()->toDateString())
            ->whereDate('end_date', '>=', now()->toDateString());
    }
}
