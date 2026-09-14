<?php
// app/Services/Access/ContentAccessService.php
namespace App\Services\Access;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ContentAccessService
{
    /**
     * فیلتر کردن Query محتوا براساس دسترسی:
     * - مهمان: فقط is_free = true
     * - کاربر: free + دامنه دسترسی پلن‌های فعال (کتاب/فصل)
     */
    public function apply(Builder $q, ?User $user, string $bookCol = 'book_id', string $chapterCol = 'chapter_id'): void
    {
        if (!$user) {
            $q->where('is_free', true);
            return;
        }

        // دسترسی‌های کاربر از plan_access (کتاب/فصل)
        $bookIds = $this->userAccessibleBookIds($user);
        $chapterIds = $this->userAccessibleChapterIds($user);

        $q->where(function($qq) use ($bookIds,$chapterIds,$bookCol,$chapterCol) {
            $qq->where('is_free', true)
                ->orWhereIn($bookCol, $bookIds)
                ->orWhereIn($chapterCol, $chapterIds);
        });
    }

    // این‌جا می‌تونی با join روی subscriptions + plan_access استخراج کنی
    private function userAccessibleBookIds(User $user): array { return []; }
    private function userAccessibleChapterIds(User $user): array { return []; }
}
