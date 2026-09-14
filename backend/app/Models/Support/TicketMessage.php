<?php

namespace App\Models\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketMessage extends Model
{
    protected $table = 'ticket_messages';
    
    protected $fillable = [
        'ticket_id',
        'sender_user_id',
        'sender_role',
        'is_internal_note',
        'body',
        'attachments_count',
        'read_by_user',
        'read_by_support',
    ];

    protected $casts = [
        'is_internal_note' => 'boolean',
        'read_by_user' => 'boolean',
        'read_by_support' => 'boolean',
        'attachments_count' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        
        // Update ticket's last_activity_at when message is created
        static::created(function ($message) {
            $message->ticket->update(['last_activity_at' => now()]);
        });
    }

    /* ===== Relationships ===== */
    
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class, 'message_id');
    }
}
