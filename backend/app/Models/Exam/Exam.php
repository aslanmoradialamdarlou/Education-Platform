<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, BelongsToMany, HasMany};

class Exam extends Model
{
    protected $table = 'exams';

    protected $fillable = [
        'user_id', 'title', 'header_template_id', 'layout',
    ];

    protected $casts = [
        'layout' => 'array', // تنظیمات چیدمان به صورت JSON
    ];

    // آیتم‌های آزمون (Pivot با فیلدهای order_number و points)
    public function items(): HasMany
    {
        return $this->hasMany(ExamQuestion::class, 'exam_id');
    }

    // دسترسی مستقیم به خودِ سوال‌ها (برای مواقعی که نیاز داری)
    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(
            \App\Models\Question\Question::class,
            'exam_questions',
            'exam_id',
            'question_id'
        )->withPivot(['order_number','points']);
    }

    // تمپلیت سربرگ/پاورقی
    public function headerTemplate(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Exam\HeaderTemplate::class, 'header_template_id');
    }

    // خروجی‌های PDF ذخیره‌شده
    public function exports(): HasMany
    {
        return $this->hasMany(ExamExport::class, 'exam_id');
    }

    public function defaultLayout(): array {
        return [
            'paper_size'  => 'a4',
            'orientation' => 'portrait',
            'font_family' => 'vazirmatn',
            'font_size'   => 12,
            'numbering'   => '1.',      // 1.  / (1)  / 1-
            'columns'     => 1,         // 1 یا 2
            'show_header' => true,
            'show_footer' => true,
            'options_label' => 'alpha', // alpha → A,B,C / numeric → 1,2,3
        ];
    }

    public function getMergedLayout(): array {
        return array_replace_recursive($this->defaultLayout(), $this->layout ?? []);
    }
}
