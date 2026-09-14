<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Support\Ticket;
use App\Models\Support\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Get all tickets for the authenticated user
     * GET /v1/tickets
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Ticket::query()
            ->where('user_id', $user->id)
            ->with(['messages' => function($q) {
                $q->where('is_internal_note', false)
                  ->orderBy('created_at', 'asc')
                  ->with('sender:id,first_name,last_name,name');
            }])
            ->orderBy('last_activity_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Search
        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
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
     * Get a single ticket with messages
     * GET /v1/tickets/{id}
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $ticket = Ticket::where('user_id', $user->id)
            ->with(['messages' => function($q) {
                $q->where('is_internal_note', false)
                  ->orderBy('created_at', 'asc')
                  ->with('sender:id,first_name,last_name,name');
            }])
            ->findOrFail($id);

        // Mark messages as read by user
        $ticket->messages()->where('read_by_user', false)->update(['read_by_user' => true]);
        $ticket->update(['unread_for_user' => 0]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Ticket retrieved',
            'data' => $this->serializeTicket($ticket, true),
        ]);
    }

    /**
     * Create a new ticket
     * POST /v1/tickets
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string'],
            'priority' => ['nullable', 'in:low,medium,high'],
            'department_id' => ['nullable', 'integer', 'exists:support_departments,id'],
            'category_id' => ['nullable', 'integer', 'exists:support_categories,id'],
        ]);

        $user = Auth::user();

        // Create ticket
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => $validated['subject'],
            'priority' => $validated['priority'] ?? 'low',
            'department_id' => $validated['department_id'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
            'status' => 'open',
            'source' => 'web',
            'unread_for_support' => 1,
        ]);

        // Create first message
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_user_id' => $user->id,
            'sender_role' => 'user',
            'body' => $validated['message'],
            'is_internal_note' => false,
            'read_by_support' => false,
        ]);

        $ticket->load(['messages' => function($q) {
            $q->where('is_internal_note', false)
              ->orderBy('created_at', 'asc')
              ->with('sender:id,first_name,last_name,name');
        }]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Ticket created successfully',
            'data' => $this->serializeTicket($ticket, true),
        ], 201);
    }

    /**
     * Add a message/reply to a ticket
     * POST /v1/tickets/{id}/messages
     */
    public function addMessage(Request $request, $id)
    {
        $validated = $request->validate([
            'message' => ['required', 'string'],
        ]);

        $user = Auth::user();
        
        $ticket = Ticket::where('user_id', $user->id)->findOrFail($id);

        // Don't allow messages on closed tickets
        if ($ticket->status === 'closed') {
            return response()->json([
                'code' => 'ERROR',
                'message' => 'Cannot add message to closed ticket',
            ], 400);
        }

        $message = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_user_id' => $user->id,
            'sender_role' => 'user',
            'body' => $validated['message'],
            'is_internal_note' => false,
            'read_by_support' => false,
        ]);

        // Update ticket status and unread count
        $ticket->update([
            'status' => 'waiting_user', // User replied, waiting for support
            'unread_for_support' => $ticket->unread_for_support + 1,
        ]);

        $message->load('sender:id,first_name,last_name,name');

        return response()->json([
            'code' => 'OK',
            'message' => 'Message sent successfully',
            'data' => $this->serializeMessage($message),
        ], 201);
    }

    /**
     * Close a ticket
     * POST /v1/tickets/{id}/close
     */
    public function close($id)
    {
        $user = Auth::user();
        
        $ticket = Ticket::where('user_id', $user->id)->findOrFail($id);

        $ticket->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Ticket closed successfully',
            'data' => ['id' => $ticket->id, 'status' => 'closed'],
        ]);
    }

    /* ===== Helper Methods ===== */

    private function serializeTicket(Ticket $ticket, bool $withMessages = false): array
    {
        $data = [
            'id' => $ticket->id,
            'code' => $ticket->code,
            'subject' => $ticket->subject,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
            'unread_for_user' => $ticket->unread_for_user,
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
        return [
            'id' => $message->id,
            'sender_role' => $message->sender_role,
            'body' => $message->body,
            'sender' => [
                'id' => $message->sender->id,
                'name' => $message->sender->first_name 
                    ? trim($message->sender->first_name . ' ' . ($message->sender->last_name ?? ''))
                    : ($message->sender->name ?? 'User'),
            ],
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }
}
