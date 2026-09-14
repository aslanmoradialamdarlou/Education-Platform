<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;

class TokenPackage extends Model
{
    protected $table = 'token_packages';

    protected $fillable = [
        'title',
        'tokens',
        'price',
        'bonus',
        'popular',
        'best_value',
    ];

    protected $casts = [
        'tokens' => 'integer',
        'price' => 'integer',
        'bonus' => 'integer',
        'popular' => 'boolean',
        'best_value' => 'boolean',
    ];
}
