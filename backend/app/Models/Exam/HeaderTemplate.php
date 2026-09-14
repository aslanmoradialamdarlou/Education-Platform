<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;

class HeaderTemplate extends Model
{
    protected $table = 'header_templates';

    protected $fillable = [
        'name',
        'template_html',
        'template_header_html',
        'template_footer_html',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
