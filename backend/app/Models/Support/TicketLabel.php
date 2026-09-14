<?php

namespace App\Models\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TicketLabel extends Model
{
    protected $table = 'ticket_labels';
    
    protected $fillable = [
        'name',
        'slug',
        'color',
    ];

    public function tickets(): BelongsToMany
    {
        return $this->belongsToMany(Ticket::class, 'ticket_label_pivot', 'label_id', 'ticket_id');
    }
}
