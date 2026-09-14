<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Commerce\WalletTransaction;
use App\Models\User;
use App\Services\Commerce\WalletService;
use Illuminate\Http\Request;

class UserWalletController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
    }

    /** GET /api/v1/admin/users/{user}/wallet */
    public function show(User $user, WalletService $wallets)
    {
        $balance = (int) $wallets->getBalance($user);
        $tx = $user->wallet()
            ->with(['transactions' => function($q){ $q->orderByDesc('id')->limit(50); }])
            ->first();

        $transactions = $tx?->transactions?->map(function (WalletTransaction $t) {
            return [
                'id'         => $t->id,
                'type'       => $t->type, // deposit|withdraw
                'amount'     => (int) $t->amount,
                'order_id'   => $t->order_id,
                'reason'     => $t->reason,
                'meta'       => $t->meta,
                'created_at' => optional($t->created_at)->toDateTimeString(),
            ];
        })->values() ?? collect();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Wallet info',
            'data'    => [
                'balance'      => $balance,
                'transactions' => $transactions,
            ],
        ]);
    }

    /** POST /api/v1/admin/users/{user}/wallet/adjust */
    public function adjust(Request $r, User $user, WalletService $wallets)
    {
        $data = $r->validate([
            'type'   => ['required','in:deposit,withdraw'],
            'amount' => ['required','integer','min:1'],
            'reason' => ['nullable','string','max:100'],
        ]);

        // Ensure wallet exists
        $wallet = $wallets->ensureWallet($user);

        if ($data['type'] === 'deposit') {
            $wallet->update(['balance' => (int)$wallet->balance + (int)$data['amount']]);
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type'      => 'deposit',
                'amount'    => (int)$data['amount'],
                'order_id'  => 0,
                'reason'    => $data['reason'] ?? 'admin_adjust_deposit',
                'meta'      => ['by'=>'admin'],
                'created_at'=> now(),
            ]);
        } else {
            $wallet->update(['balance' => max(0, (int)$wallet->balance - (int)$data['amount'])]);
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type'      => 'withdraw',
                'amount'    => (int)$data['amount'],
                'order_id'  => 0,
                'reason'    => $data['reason'] ?? 'admin_adjust_withdraw',
                'meta'      => ['by'=>'admin'],
                'created_at'=> now(),
            ]);
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Wallet adjusted',
            'data'    => ['balance' => $wallets->getBalance($user)],
        ], 201);
    }
}
