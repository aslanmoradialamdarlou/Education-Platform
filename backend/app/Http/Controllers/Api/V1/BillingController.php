<?php
// app/Http/Controllers/Api/V1/Account/BillingController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Billing\Subscription;
use App\Models\Billing\TokenCounter;
use App\Models\Billing\TokenUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillingController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum']);
    }

    /** مانده توکن‌ها (تجمیعی + لیست سطرها) */
    public function tokens(Request $r)
    {
        $userId = $r->user()->id;

        $rows = TokenCounter::where('user_id', $userId)
            ->where(function($q){
                $q->whereNull('valid_until')
                    ->orWhere('valid_until','>=', now()->toDateString());
            })
            ->orderBy('valid_until')
            ->get(['id','plan_id','tokens_total','tokens_used','valid_until']);

        $remain = $rows->sum(fn($c) => max(0, $c->tokens_total - $c->tokens_used));

        return response()->json([
            'code' => 'OK',
            'message' => 'Token balances',
            'data' => [
                'remain_total' => (int)$remain,
                'counters' => $rows->map(fn($c)=>[
                    'id'           => $c->id,
                    'plan_id'      => $c->plan_id,
                    'tokens_total' => (int)$c->tokens_total,
                    'tokens_used'  => (int)$c->tokens_used,
                    'remain'       => max(0, (int)$c->tokens_total - (int)$c->tokens_used),
                    'valid_until'  => optional($c->valid_until)->toDateString(),
                ]),
            ],
        ]);
    }

    /** اشتراک‌های فعال کاربر */
    public function subscriptions(Request $r)
    {
        $userId = $r->user()->id;

        $subs = Subscription::with('plan:id,name,slug,token_quota,duration_days')
            ->where('user_id', $userId)
            ->where('status','active')
            ->whereDate('start_date','<=', now()->toDateString())
            ->whereDate('end_date','>=', now()->toDateString())
            ->orderByDesc('id')
            ->get(['id','plan_id','start_date','end_date','status']);

        return response()->json([
            'code' => 'OK',
            'message' => 'Active subscriptions',
            'data' => $subs->map(fn($s)=>[
                'id'         => $s->id,
                'plan'       => [
                    'id'   => $s->plan?->id,
                    'name' => $s->plan?->name,
                    'slug' => $s->plan?->slug,
                ],
                'start_date' => optional($s->start_date)->toDateString(),
                'end_date'   => optional($s->end_date)->toDateString(),
                'status'     => $s->status,
            ]),
        ]);
    }

    /** تاریخچه مصرف توکن‌ها */
    public function tokenUsages(Request $r)
    {
        $perPage = (int) $r->integer('per_page', 20);

        $q = TokenUsage::where('user_id', $r->user()->id)
            ->orderByDesc('used_at');

        $p = $q->paginate($perPage);

        return response()->json([
            'code' => 'OK',
            'message' => 'Token usage history',
            'data' => $p->through(fn($u)=>[
                'id'             => $u->id,
                'exam_id'        => $u->exam_id,
                'question_count' => $u->question_count,
                'used_at'        => optional($u->used_at)->toDateTimeString(),
            ]),
            'meta' => [
                'current_page' => $p->currentPage(),
                'per_page'     => $p->perPage(),
                'total'        => $p->total(),
            ],
        ]);
    }
}
