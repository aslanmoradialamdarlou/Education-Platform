<?php

namespace App\Models\Question;

use App\Models\User;
use App\Models\Curriculum\{Grade, Book, Chapter, Subchapter};
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{
    BelongsTo, HasMany, BelongsToMany
};
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use SoftDeletes;

    protected $table = 'questions';
    protected $guarded = [];

    protected $casts = [
        'is_free'      => 'boolean',
        'meta'         => 'array',
        'published_at' => 'datetime',
        'deleted_at'   => 'datetime',
    ];

    /* ---------- روابط درخت محتوایی ---------- */
    public function grade(): BelongsTo     { return $this->belongsTo(Grade::class); }
    public function book(): BelongsTo      { return $this->belongsTo(Book::class); }
    public function chapter(): BelongsTo   { return $this->belongsTo(Chapter::class); }
    public function subchapter(): BelongsTo{ return $this->belongsTo(Subchapter::class); }

    /* ---------- نویسنده ---------- */
    public function author(): BelongsTo    { return $this->belongsTo(User::class,'author_id'); }

    /* ---------- انواع وابسته به نوع سؤال ---------- */
    public function options(): HasMany     { return $this->hasMany(QuestionOption::class); }       // تستی
    public function pairs(): HasMany       { return $this->hasMany(QuestionPair::class); }         // وصل‌کردنی
    public function blanks(): HasMany      { return $this->hasMany(QuestionBlank::class); }        // جای‌خالی
    public function assets(): HasMany      { return $this->hasMany(QuestionAsset::class); }        // ضمیمه‌ها

    /* ---------- تگ‌ها ---------- */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(QuestionTag::class, 'question_tag_pivot', 'question_id', 'tag_id');
    }

    /* ---------- اسکوپ‌های پرکاربرد ---------- */
    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status','published');
    }

    public function scopeOfType(Builder $q, ?string $typeSlug): Builder
    {
        if (!$typeSlug) return $q;
        // اگر جدول question_types ستون slug دارد:
        return $q->whereHas('type', fn($qq)=>$qq->where('name',$typeSlug));
    }

    public function scopeDifficulty(Builder $q, ?string $diff): Builder
    {
        return $diff ? $q->where('difficulty',$diff) : $q;
    }

    public function scopeInCurriculum(Builder $q, array $filters): Builder
    {
        // فیلترهای ممکن: grade_id, book_id, chapter_id, subchapter_id
        foreach (['grade_id','book_id','chapter_id','subchapter_id'] as $k) {
            if (isset($filters[$k]) && $filters[$k]) {
                $q->where($k, $filters[$k]);
                break; // گرانولارترین کفایت می‌کند
            }
        }
        return $q;
    }

    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (!$term) return $q;
        return $q->where(function ($qq) use ($term) {
            $qq->where('question_text','like',"%$term%")
                ->orWhere('answer_text','like',"%$term%")
                ->orWhere('source','like',"%$term%");
        });
    }

    /* اگر جدول question_types داری */
    public function type(): BelongsTo
    {
        return $this->belongsTo(QuestionType::class, 'type_id');
    }

    public function scopeFilterParams($q, array $p)
    {
        // جستجو در متن سؤال/پاسخ
        if (!empty($p['q'])) {
            $q->where(function($qq) use ($p) {
                $qq->where('question_text','like','%'.$p['q'].'%')
                    ->orWhere('answer_text','like','%'.$p['q'].'%');
            });
        }

        // نوع سؤال - Support both single and multiple types
        if (!empty($p['type'])) {
            // می‌تواند عدد type_id یا نام/slug نوع باشد
            if (is_numeric($p['type'])) {
                $q->where('type_id', (int) $p['type']);
            } else {
                $q->whereHas('type', fn($t)=>$t->where('name', $p['type']));
            }
        }
        if (!empty($p['types']) && is_array($p['types'])) {
            $q->whereHas('type', fn($t) => $t->whereIn('name', $p['types']));
        }

        // درجه سختی - Support both single and multiple difficulties
        if (!empty($p['difficulty'])) { // easy|medium|hard
            $q->where('difficulty', $p['difficulty']);
        }
        if (!empty($p['difficulties']) && is_array($p['difficulties'])) {
            $q->whereIn('difficulty', $p['difficulties']);
        }

        // منبع
        if (!empty($p['source'])) {
            $q->where('source', $p['source']);
        }

        // شماره صفحه (دقیق یا بازه)
        if (!empty($p['page_no'])) {
            $q->where('book_page', (int) $p['page_no']);
        }
        if (!empty($p['page_from'])) {
            $q->where('book_page', '>=', (int) $p['page_from']);
        }
        if (!empty($p['page_to'])) {
            $q->where('book_page', '<=', (int) $p['page_to']);
        }

        // فیلتر Free/Non-free
        if (!is_null($p['free'] ?? null)) {
            $q->where('is_free', filter_var($p['free'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0);
        }

        // فیلترهای سلسله‌مراتبی
        if (!empty($p['subchapter_id'])) {
            $q->where('subchapter_id', (int) $p['subchapter_id']);
        }
        if (!empty($p['chapter_id'])) {
            $q->whereHas('subchapter.chapter', fn($c)=>$c->where('id', (int)$p['chapter_id']));
        }
        if (!empty($p['chapter_ids']) && is_array($p['chapter_ids'])) {
            $q->whereHas('subchapter.chapter', fn($c)=>$c->whereIn('id', $p['chapter_ids']));
        }
        if (!empty($p['book_id'])) {
            $q->whereHas('subchapter.chapter.book', fn($b)=>$b->where('id', (int)$p['book_id']));
        }
        if (!empty($p['grade_id'])) {
            $q->whereHas('subchapter.chapter.book.grade', fn($g)=>$g->where('id', (int)$p['grade_id']));
        }
        if (!empty($p['grade_ids']) && is_array($p['grade_ids'])) {
            $q->whereHas('subchapter.chapter.book.grade', fn($g)=>$g->whereIn('id', $p['grade_ids']));
        }

        // فیلتر بر اساس تگ‌ها (هر کدام از تگ‌ها کفایت کند)
        if (!empty($p['tags']) && is_array($p['tags'])) {
            $q->whereHas('tags', fn($t)=>$t->whereIn('slug', $p['tags']));
        }

        return $q;
    }
}
