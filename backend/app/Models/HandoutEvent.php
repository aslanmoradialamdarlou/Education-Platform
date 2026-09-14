<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HandoutEvent extends Model
{
    public $timestamps = false;
    protected $table = 'handout_events';
    protected $fillable = ['handout_id','event_type','created_at'];
}
