<?php
// app/Services/Tokens/TokenService.php
namespace App\Services\Tokens;

use App\Models\Billing\{TokenCounter, TokenUsage};
use App\Models\User;
use App\Models\Exam\Exam;
use Illuminate\Support\Facades\DB;

class TokenService
{
    public function addTokens(User $user, int $amount, ?int $planId = null, ?string $validUntil = null): void
    {
        DB::transaction(function() use ($user,$amount,$planId,$validUntil) {
            $counter = TokenCounter::firstOrCreate(
                ['user_id'=>$user->id,'plan_id'=>$planId],
                ['tokens_total'=>0,'tokens_used'=>0,'valid_until'=>$validUntil]
            );
            if ($validUntil) {
                $d = now()->parse($validUntil)->toDateString();
                if (!$counter->valid_until || $counter->valid_until->lt($d)) {
                    $counter->valid_until = $d;
                }
            }
            $counter->tokens_total += $amount;
            $counter->save();
        });
    }

    public function remain(User $user): int
    {
        $row = DB::table('token_counters')
            ->where('user_id', $user->id)
            ->where(function($q){
                $q->whereNull('valid_until')->orWhere('valid_until','>=',now()->toDateString());
            })
            ->selectRaw('COALESCE(SUM(tokens_total - tokens_used),0) as remain')
            ->first();
        return (int)($row->remain ?? 0);
    }

    // متد consumeForExport خودت خوب بود – همونو نگه‌دار
    public function consumeForExport(User $user, Exam $exam, int $tokensPerQuestion = 1): array
    {
        // ... همان کد قبلی تو با lockForUpdate (عالیه)
        // (بدون تغییر)
        $needed = max(1, $exam->items()->count() * $tokensPerQuestion);

        $row = DB::table('token_counters')
            ->where('user_id', $user->id)
            ->where(function($q){
                $q->whereNull('valid_until')->orWhere('valid_until','>=',now()->toDateString());
            })
            ->selectRaw('COALESCE(SUM(tokens_total - tokens_used),0) as remain')
            ->first();

        $remain = (int)($row->remain ?? 0);
        if ($remain < $needed) {
            return ['ok'=>false, 'needed'=>$needed, 'remain'=>$remain];
        }

        $counters = DB::table('token_counters')
            ->where('user_id', $user->id)
            ->where(function($q){
                $q->whereNull('valid_until')->orWhere('valid_until','>=',now()->toDateString());
            })
            ->orderBy('valid_until')
            ->lockForUpdate()
            ->get();

        $toConsume = $needed;
        foreach ($counters as $c) {
            if ($toConsume <= 0) break;
            $free = $c->tokens_total - $c->tokens_used;
            if ($free <= 0) continue;

            $use = min($free, $toConsume);
            DB::table('token_counters')
                ->where('id',$c->id)
                ->update(['tokens_used' => $c->tokens_used + $use]);

            $toConsume -= $use;
        }

        DB::table('token_usages')->insert([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'question_count' => $exam->items()->count(),
            'used_at' => now(),
        ]);

        return ['ok'=>true,'needed'=>$needed,'remain_after'=>$remain - $needed];
    }
}
