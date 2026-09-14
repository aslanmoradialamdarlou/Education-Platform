<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Support\Ticket;
use App\Models\Support\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    /**
     * Get all tickets (admin view)
     * GET /v1/admin/tickets
     */
    public function index(Request $request)
    {
        $query = Ticket::query()
            ->with([
                'user:id,first_name,last_name,name,email',
                'messages' => function($q) {
                    $q->where('is_internal_note', false)
                      ->orderBy('created_at', 'asc')
                      ->with('sender:id,first_name,last_name,name');
                }
            ])
            ->orderBy('last_activity_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        // Search
        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->integer('per_page', 20);
        $tickets = $query->paginate($perPage);

        return response()->json([
            'code' => 'OK',
            'message' => 'Tickets retrieved',
            'data' => $tickets->through(fn($ticket) => $this->serializeTicket($ticket)),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    /**
     * Get a single ticket with messages (admin view)
     * GET /v1/admin/tickets/{id}
     */
    public function show($id)
    {
        $ticket = Ticket::with([
                'user:id,first_name,last_name,name,email',
                'messages' => function($q) {
                    $q->where('is_internal_note', false)
                      ->orderBy('created_at', 'asc')
                      ->with('sender:id,first_name,last_name,name');
                }
            ])
            ->findOrFail($id);

        // Mark messages as read by support
        $ticket->messages()
            ->where('sender_role', 'user')
            ->where('read_by_support', false)
            ->update(['read_by_support' => true]);

        // Update unread counter
        $ticket->update([
            'unread_for_support' => 0,
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Ticket retrieved',
            'data' => $this->serializeTicket($ticket, true),
        ]);
    }

    /**
     * Reply to a ticket (admin)
     * POST /v1/admin/tickets/{id}/messages
     */
    public function addMessage(Request $request, $id)
    {
        $admin = Auth::user();
        
        $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $ticket = Ticket::findOrFail($id);

        $message = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_user_id' => $admin->id,
            'sender_role' => 'agent',
            'body' => $request->input('message'),
            'read_by_support' => true,
            'read_by_user' => false,
        ]);

        // Update ticket unread counter for user
        $ticket->increment('unread_for_user');

        // Optionally change status to in_progress if it was open
        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }
        // Or to waiting_user if admin replied
        if ($ticket->status === 'in_progress') {
            $ticket->update(['status' => 'waiting_user']);
        }

        $message->load('sender:id,first_name,last_name,name');

        return response()->json([
            'code' => 'OK',
            'message' => 'Message sent successfully',
            'data' => $this->serializeMessage($message),
        ], 201);
    }

    /**
     * Update ticket status
     * PUT /v1/admin/tickets/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,waiting_user,closed',
        ]);

        $ticket = Ticket::findOrFail($id);
        
        $ticket->update([
            'status' => $request->input('status'),
            'closed_at' => $request->input('status') === 'closed' ? now() : null,
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Ticket status updated',
            'data' => ['id' => $ticket->id, 'status' => $ticket->status],
        ]);
    }

    /**
     * Update ticket priority
     * PUT /v1/admin/tickets/{id}/priority
     */
    public function updatePriority(Request $request, $id)
    {
        $request->validate([
            'priority' => 'required|in:low,medium,high',
        ]);

        $ticket = Ticket::findOrFail($id);
        
        $ticket->update([
            'priority' => $request->input('priority'),
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Ticket priority updated',
            'data' => ['id' => $ticket->id, 'priority' => $ticket->priority],
        ]);
    }

    /* ===== Helper Methods ===== */

    private function serializeTicket(Ticket $ticket, bool $withMessages = false): array
    {
        $userData = null;
        if ($ticket->relationLoaded('user') && $ticket->user) {
            $userData = [
                'id' => $ticket->user->id,
                'name' => $ticket->user->name ?? $ticket->user->first_name . ' ' . $ticket->user->last_name,
                'email' => $ticket->user->email,
            ];
        }

        $data = [
            'id' => $ticket->id,
            'code' => $ticket->code,
            'subject' => $ticket->subject,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
            'unread_for_support' => $ticket->unread_for_support,
            'unread_for_user' => $ticket->unread_for_user,
            'user' => $userData,
            'created_at' => $ticket->created_at?->toIso8601String(),
            'last_activity_at' => $ticket->last_activity_at?->toIso8601String(),
            'closed_at' => $ticket->closed_at?->toIso8601String(),
        ];

        if ($withMessages && $ticket->relationLoaded('messages')) {
            $data['messages'] = $ticket->messages->map(fn($msg) => $this->serializeMessage($msg));
        }

        return $data;
    }

    private function serializeMessage(TicketMessage $message): array
    {
        $senderName = null;
        if ($message->relationLoaded('sender') && $message->sender) {
            $senderName = $message->sender->name ?? $message->sender->first_name . ' ' . $message->sender->last_name;
        }

        return [
            'id' => $message->id,
            'sender_role' => $message->sender_role,
            'sender_name' => $senderName,
            'body' => $message->body,
            'read_by_user' => $message->read_by_user,
            'read_by_support' => $message->read_by_support,
            'created_at' => $message->created_at?->toIso8601String(),
            'created_at_human' => $message->created_at?->diffForHumans(),
        ];
    }
}
