<?php
// app/Models/Billing/TokenCounter.php
namespace App\Models\Billing;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenCounter extends Model
{
    protected $table = 'token_counters';
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = [
        'valid_until' => 'date',
    ];
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class,'plan_id');
    }

    /** باقی‌ماندهٔ توکن در همین سطر */
    public function getRemainAttribute(): int
    {
        $total = (int) ($this->tokens_total ?? 0);
        $used  = (int) ($this->tokens_used  ?? 0);
        return max(0, $total - $used);
    }
}
