<?php
// app/Models/Billing/TokenUsage.php
namespace App\Models\Billing;

use App\Models\User;
use App\Models\Exam\Exam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenUsage extends Model
{
    protected $table = 'token_usages';
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = [
        'used_at' => 'datetime',
    ];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function exam(): BelongsTo { return $this->belongsTo(Exam::class); }
}
