<?php
// app/Models/Billing/SubscriptionPlan.php
namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class SubscriptionPlan extends Model
{
    protected $table = 'subscription_plans';
    protected $guarded = [];
    public $timestamps = true;
    protected $casts = [
        'price'       => 'decimal:2', // خروجی string (همان رفتار لاراول)
        'is_active'   => 'boolean',
        'duration_days' => 'integer',
        'token_quota'   => 'integer',
    ];

    public function accesses(): HasMany
    {
        return $this->hasMany(PlanAccess::class, 'plan_id');
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }
}
