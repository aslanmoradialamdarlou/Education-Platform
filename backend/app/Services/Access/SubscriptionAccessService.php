<?php
// app/Services/Access/SubscriptionAccessService.php
namespace App\Services\Access;

use App\Models\User;
use App\Models\Content\Content;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class SubscriptionAccessService
{
    /** دسترسی به سؤال‌ها (قبلاً داشتی) */
    public function applyQuestionAccessScope(Builder $q, ?User $user): Builder
    {
        $q->where(function(Builder $w) use ($user) {
            $w->where('is_free', true);

            if ($user) {
                $w->orWhere(function(Builder $w2) use ($user) {
                    $w2->whereExists(function($sub) use ($user) {
                        $sub->from('subscriptions')
                            ->whereColumn('subscriptions.user_id', DB::raw($user->id))
                            ->where('status','active')
                            ->whereDate('start_date','<=', now()->toDateString())
                            ->whereDate('end_date','>=', now()->toDateString());
                    });
                    $w2->whereExists(function($pa) {
                        $pa->from('plan_access')
                            ->join('subscriptions','subscriptions.plan_id','=','plan_access.plan_id')
                            ->where('subscriptions.status','active')
                            ->whereDate('subscriptions.start_date','<=', now()->toDateString())
                            ->whereDate('subscriptions.end_date','>=', now()->toDateString())
                            ->where(function($cond){
                                $cond->whereColumn('plan_access.subchapter_id', 'questions.subchapter_id')
                                    ->orWhereColumn('plan_access.chapter_id',    'questions.chapter_id')
                                    ->orWhereColumn('plan_access.book_id',       'questions.book_id')
                                    ->orWhereColumn('plan_access.grade_id',      'questions.grade_id');
                            });
                    });
                });
            }
        });

        return $q;
    }

    /** دسترسی به محتوا (ویدئو/درس‌ها) بر پایه subchapter_id + is_free */
    public function applyContentAccessScope(Builder $q, ?User $user): Builder
    {
        $q->where(function(Builder $w) use ($user) {
            $w->where('is_free', true);

            if ($user) {
                $w->orWhere(function(Builder $w2) use ($user) {
                    $w2->whereExists(function($sub) use ($user) {
                        $sub->from('subscriptions')
                            ->whereColumn('subscriptions.user_id', DB::raw($user->id))
                            ->where('status','active')
                            ->whereDate('start_date','<=', now()->toDateString())
                            ->whereDate('end_date','>=', now()->toDateString());
                    });
                    $w2->whereExists(function($pa) {
                        $pa->from('plan_access')
                            ->join('subscriptions','subscriptions.plan_id','=','plan_access.plan_id')
                            ->where('subscriptions.status','active')
                            ->whereDate('subscriptions.start_date','<=', now()->toDateString())
                            ->whereDate('subscriptions.end_date','>=', now()->toDateString())
                            ->where(function($cond){
                                // محتوا ستون subchapter_id دارد
                                $cond->whereColumn('plan_access.subchapter_id', 'contents.subchapter_id')
                                    ->orWhereExists(function($b){
                                        // اگر subchapter → chapter → book را لازم داری، اینجا می‌شود join زد؛
                                        // فعلاً ساده‌ترین مسیر: اگر chapter_id در plan_access ست شده باشد و حیطه زیر‌فصل آن در همان چپتر باشد
                                        // برای سادگی از همان subchapter_id کفایت می‌کنیم مگر بعداً chain کامل خواستی.
                                    });
                            });
                    });
                });
            }
        });

        return $q;
    }

    public function userCanAccessQuestion(?User $user, \App\Models\Question\Question $q): bool
    {
        if (!$user) return (bool)$q->is_free;
        if ($q->is_free) return true;

        return $this->hasAccessBySubchapter($user, $q->subchapter_id);
    }

    public function userCanAccessContent(?\App\Models\User $user, \App\Models\Content\Content $content): bool
    {
        if ($content->is_free) return true;
        if (!$user) return false;

        // مشابه سؤال‌ها: بررسی plan_access با پوشش grade/book/chapter/subchapter
        // بسته به اسکیمای محتوا، اگر content فقط subchapter_id دارد، از همان استفاده کن:
        return $this->hasAccessToSubchapter($user, $content->subchapter_id);
    }

    /** بررسی دسترسی کاربر به یک subchapter_id */
    private function hasAccessBySubchapter(User $user, ?int $subchapterId): bool
    {
        if (!$subchapterId) return false;

        return DB::table('plan_access')
            ->join('subscriptions','subscriptions.plan_id','=','plan_access.plan_id')
            ->where('subscriptions.user_id', $user->id)
            ->where('subscriptions.status','active')
            ->whereDate('subscriptions.start_date','<=', now()->toDateString())
            ->whereDate('subscriptions.end_date','>=', now()->toDateString())
            ->where(function($q) use ($subchapterId){
                $q->where('plan_access.subchapter_id', $subchapterId);
                // اگر لازم شد chain chapter/book/grade را اینجا هم اضافه کن
            })
            ->exists();
    }
}
