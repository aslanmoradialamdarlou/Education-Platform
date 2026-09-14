<?php

namespace App\Models;

use App\Models\Billing\Subscription;
use App\Models\Billing\TokenCounter;
use App\Models\Media\VideoLicense;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany};
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{

    use HasApiTokens, HasFactory, Notifiable, HasRoles;

//    protected $guarded = [];

    protected $guard_name = 'api';
    protected $fillable = [
        'first_name','last_name','name',
        'phone','email','password',
        'city','province','school_name','grade_id',
        'is_active','suspended_at',
        'avatar',
        // temporary marker for users created during register-start
        'is_temporary',
    ];


    protected $hidden = ['password_hash','remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active'         => 'boolean',
        'suspended_at'      => 'datetime',
        'is_temporary'      => 'boolean',
    ];

    public function grade(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Curriculum\Grade::class);
    }

    // RBAC
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(\App\Models\RBAC\Role::class, 'user_roles', 'user_id', 'role_id');
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(\App\Models\RBAC\Permission::class, 'user_permissions', 'user_id', 'permission_id');
    }

    // Commerce
    public function orders(): HasMany
    {
        return $this->hasMany(\App\Models\Commerce\Order::class);
    }

    public function wallet(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Models\Commerce\Wallet::class);
    }

    // Content
    public function videoLicenses(): HasMany
    {
        return $this->hasMany(VideoLicense::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function tokenCounters(): HasMany
    {
        return $this->hasMany(TokenCounter::class);
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true)->whereNull('suspended_at');
    }
}
