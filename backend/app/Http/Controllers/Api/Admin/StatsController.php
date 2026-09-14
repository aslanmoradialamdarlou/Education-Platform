<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Billing\Subscription;
use App\Models\Commerce\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class StatsController extends Controller
{
    /**
     * GET /v1/admin/stats
     * Basic KPI totals for the admin dashboard.
     * - users: total active users excluding admins and temporary placeholders
     * - recentUsers30: new users (same filter) created in the last 30 days
     * - activeSubs: currently active subscriptions (status active and in date window)
     * - monthlyRevenue: sum of paid orders in current month (integer – toman)
     * - openTickets: placeholder (0) – no tickets table in schema yet
     */
    public function index(Request $request)
    {
        $user = $request->user();
        // Robust role check (case-insensitive) to permit both 'admin' and 'Administrator'
        $roleNames = collect(method_exists($user, 'getRoleNames') ? $user->getRoleNames() : [])->map(fn($n) => strtolower((string)$n));
        $isAdmin = $roleNames->contains(fn($n) => $n === 'admin' || str_contains($n, 'admin'));
        if (! $isAdmin) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Exclude these role names from user counts
        $adminRoleNames = ['admin', 'Administrator'];

        $usersBase = User::query()->active();
        // Backward compatible: only filter 'is_temporary' if the column exists
        if (Schema::hasColumn('users', 'is_temporary')) {
            $usersBase->where('is_temporary', false);
        }
        $usersBase->whereDoesntHave('roles', function ($q) use ($adminRoleNames) {
            $q->whereIn('name', $adminRoleNames);
        });

        $totalUsers = (int) $usersBase->count();

        $recentQuery = User::query()->active()
            ->where('created_at', '>=', now()->subDays(30));
        if (Schema::hasColumn('users', 'is_temporary')) {
            $recentQuery->where('is_temporary', false);
        }
        $recentUsers30 = (int) $recentQuery
            ->whereDoesntHave('roles', function ($q) use ($adminRoleNames) {
                $q->whereIn('name', $adminRoleNames);
            })
            ->count();

        $activeSubs = (int) Subscription::query()->active()->count();

        $monthStart = now()->startOfMonth();
        $monthlyRevenue = (int) round(
            (float) Order::query()
                ->where('status', 'paid')
                ->whereNotNull('paid_at')
                ->whereBetween('paid_at', [$monthStart, now()])
                ->sum('total_amount')
        );

        // Placeholder until a ticketing module exists
        $openTickets = 0;

        return response()->json([
            'totals' => [
                'users'           => $totalUsers,
                'recentUsers30'   => $recentUsers30,
                'activeSubs'      => $activeSubs,
                'monthlyRevenue'  => $monthlyRevenue,
                'openTickets'     => $openTickets,
            ],
        ]);
    }
}
