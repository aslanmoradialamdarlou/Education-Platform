<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Wallet;
use App\Models\Commerce\WalletTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function ensureWallet(User $user): Wallet
    {
        return Wallet::firstOrCreate(['user_id'=>$user->id], ['balance'=>0]);
    }

    public function getBalance(User $user): int
    {
        return (int) $this->ensureWallet($user)->balance;
    }

    /**
     * رزرو مبلغ از کیف‌پول برای سفارش (کاهش موجودی + تراکنش withdraw با meta.reserved=true)
     * Idempotent با کلید (user_id, order_id)
     */
    public function reserve(User $user, int $orderId, int $amount): int
    {
        if ($amount <= 0) return 0;

        return DB::transaction(function () use ($user, $orderId, $amount) {
            $wallet = $this->ensureWallet($user);

            // اگر قبلا رزرو شده، همان مقدار را برگردان
            $exists = WalletTransaction::where('wallet_id',$wallet->id)
                ->where('order_id',$orderId)
                ->where('type','withdraw')
                ->where('meta->reserved', true)
                ->first();
            if ($exists) return (int)$exists->amount;

            $available = (int) $wallet->balance;
            $apply = min($available, $amount);
            if ($apply <= 0) return 0;

            // کاهش موجودی
            $wallet->update(['balance' => $wallet->balance - $apply]);

            // تراکنش
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type'      => 'withdraw',
                'amount'    => $apply,
                'order_id'  => $orderId,
                'reason'    => 'order_reserve',
                'meta'      => ['reserved'=>true],
            ]);

            return $apply;
        });
    }

    /** آزادسازی رزرو در صورت لغو/عدم پرداخت */
    public function release(User $user, int $orderId): void
    {
        DB::transaction(function () use ($user, $orderId) {
            $wallet = $this->ensureWallet($user);

            $tx = WalletTransaction::where('wallet_id',$wallet->id)
                ->where('order_id',$orderId)
                ->where('type','withdraw')
                ->where('meta->reserved', true)
                ->first();
            if (!$tx) return;

            // برگشت موجودی
            $wallet->update(['balance' => $wallet->balance + $tx->amount]);

            // لاگ برگشت
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type'      => 'deposit',
                'amount'    => $tx->amount,
                'order_id'  => $orderId,
                'reason'    => 'order_release',
                'meta'      => ['release_of'=>$tx->id],
            ]);

            // علامت‌گذاری رزرو قبلی
            $meta = $tx->meta ?? [];
            $meta['released'] = true;
            $tx->update(['meta' => $meta]);
        });
    }
}
