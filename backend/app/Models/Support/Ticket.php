<?php

namespace App\Models\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ticket extends Model
{
    protected $table = 'tickets';
    
    protected $fillable = [
        'code',
        'user_id',
        'department_id',
        'category_id',
        'assignee_user_id',
        'subject',
        'status',
        'priority',
        'last_activity_at',
        'closed_at',
        'unread_for_user',
        'unread_for_support',
        'source',
        'meta',
    ];

    protected $casts = [
        'last_activity_at' => 'datetime',
        'closed_at' => 'datetime',
        'meta' => 'array',
        'unread_for_user' => 'integer',
        'unread_for_support' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        
        // Auto-generate unique code on creation
        static::creating(function ($ticket) {
            if (empty($ticket->code)) {
                $ticket->code = 'T-' . str_pad(self::max('id') + 1, 4, '0', STR_PAD_LEFT);
            }
            $ticket->last_activity_at = now();
        });
    }

    /* ===== Relationships ===== */
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_user_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(SupportDepartment::class, 'department_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SupportCategory::class, 'category_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class, 'ticket_id')->orderBy('created_at');
    }

    public function watchers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'ticket_watchers', 'ticket_id', 'user_id');
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(TicketLabel::class, 'ticket_label_pivot', 'ticket_id', 'label_id');
    }

    /* ===== Scopes ===== */
    
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
