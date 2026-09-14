<?php

namespace App\Models\Billing;

use App\Models\Curriculum\Book;
use App\Models\Curriculum\Chapter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanAccess extends Model
{
    protected $table = 'plan_access';
    protected $guarded = [];
    public $timestamps = false;

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class, 'chapter_id');
    }
}
