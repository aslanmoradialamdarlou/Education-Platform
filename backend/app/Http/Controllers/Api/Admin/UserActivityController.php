<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserActivityController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
    }

    /**
     * GET /api/v1/admin/users/{user}/activity-logs
     * Returns recent login activity for a user (from login_logs).
     */
    public function index(Request $r, User $user)
    {
        $perPage = (int) $r->integer('per_page', 20);
        $page    = (int) $r->integer('page', 1);

        $query = DB::table('login_logs')
            ->where('user_id', $user->id)
            ->orderByDesc('id');

        $total = (clone $query)->count();
        $items = $query
            ->forPage($page, $perPage)
            ->get(['id','user_id','ip_address','user_agent','login_method','created_at']);

        // map to simple resource-like array
        $data = $items->map(function ($row) {
            return [
                'id'           => $row->id,
                'ip'           => $row->ip_address,
                'user_agent'   => $row->user_agent,
                'method'       => $row->login_method,
                'created_at'   => $row->created_at,
            ];
        });

        return response()->json([
            'code'    => 'OK',
            'message' => 'Activity logs',
            'data'    => $data,
            'meta'    => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
            ],
        ]);
    }
}
