<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Handout extends Model
{
    use HasFactory;

    protected $table = 'handouts';

    protected $fillable = [
        'title','description','pdf_url','pages','price','teacher','grade','subject','chapter','access_type','status','access_revoked','teacher_guide_url','class_summary_url','added_date'
    ];

    protected $casts = [
        'access_revoked' => 'boolean',
        'added_date' => 'datetime',
    ];
}
