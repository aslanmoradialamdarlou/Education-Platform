<?php
// app/Http/Controllers/Api/V1/ProfileTokensController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Billing\Subscription;
use App\Models\Billing\TokenCounter;
use App\Models\Billing\TokenUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileTokensController extends Controller
{
    public function tokens(Request $r)
    {
        $u = $r->user();

        // تجمیع سریع
        $rows = TokenCounter::with('plan:id,name,slug')
            ->where('user_id', $u->id)
            ->orderByRaw('CASE WHEN valid_until IS NULL THEN 1 ELSE 0 END DESC')
            ->orderBy('valid_until')
            ->get();

        $remainTotal = (int) DB::table('token_counters')
            ->where('user_id', $u->id)
            ->where(function($q){
                $q->whereNull('valid_until')->orWhere('valid_until','>=', now()->toDateString());
            })
            ->selectRaw('COALESCE(SUM(tokens_total - tokens_used),0) as remain')
            ->value('remain');

        return response()->json([
            'code' => 'OK',
            'message' => 'Token balances',
            'data' => [
                'remain_total' => $remainTotal,
                'counters' => $rows->map(fn($c)=>[
                    'id'          => $c->id,
                    'plan'        => $c->plan?->only(['id','name','slug']),
                    'tokens_total'=> (int)$c->tokens_total,
                    'tokens_used' => (int)$c->tokens_used,
                    'remain'      => (int)$c->remain,
                    'valid_until' => optional($c->valid_until)->toDateString(),
                ]),
            ],
        ]);
    }

    public function subscriptions(Request $r)
    {
        $u = $r->user();

        $subs = Subscription::with('plan:id,name,slug,duration_days,token_quota,price,currency')
            ->where('user_id', $u->id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'code' => 'OK',
            'message' => 'My subscriptions',
            'data' => $subs->map(function($s){
                $daysRemain = $s->end_date ? max(0, now()->diffInDays($s->end_date, false)) : null;
                return [
                    'id'            => $s->id,
                    'status'        => $s->status,
                    'start_date'    => optional($s->start_date)->toDateString(),
                    'end_date'      => optional($s->end_date)->toDateString(),
                    'days_remaining'=> $daysRemain,
                    'plan'          => $s->plan ? [
                        'id'    => $s->plan->id,
                        'name'  => $s->plan->name,
                        'slug'  => $s->plan->slug,
                        'price' => (string)$s->plan->price.' '.$s->plan->currency,
                        'duration_days' => $s->plan->duration_days,
                        'token_quota'   => $s->plan->token_quota,
                    ] : null,
                ];
            }),
        ]);
    }

    public function tokenUsage(Request $r)
    {
        $u = $r->user();
        $per = $r->integer('per_page', 20);

        $q = TokenUsage::query()->where('user_id', $u->id)->orderByDesc('used_at');
        $p = $q->paginate($per);

        return response()->json([
            'code' => 'OK',
            'message' => 'Token usage',
            'data' => $p->through(function(TokenUsage $tu){
                return [
                    'id'             => $tu->id,
                    'exam_id'        => $tu->exam_id,
                    'question_count' => $tu->question_count,
                    'used_at'        => optional($tu->used_at)->toDateTimeString(),
                ];
            }),
            'meta' => [
                'current_page' => $p->currentPage(),
                'per_page'     => $p->perPage(),
                'total'        => $p->total(),
            ]
        ]);
    }
}
