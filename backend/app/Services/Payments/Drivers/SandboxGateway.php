<?php

namespace App\Services\Payments\Drivers;

use App\Events\OrderPaid;
use App\Models\Commerce\Order;
use App\Models\Commerce\Transaction;
use App\Services\Payments\Contracts\PaymentGateway; // 👈
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SandboxGateway implements PaymentGateway // 👈 implements
{
    public function name(): string { return 'sandbox'; }


    public function pay(Order $order): array
    {
        $callback = route('api.v1.payments.callback', ['driver' => 'sandbox']);
        return ['redirect' => $callback.'?order='.$order->id.'&result=ok'];
    }

    public function callback(Request $r): array
    {
        $orderId = (int) $r->query('order');
        $result  = (string) $r->query('result', 'fail');

        $order = Order::query()->lockForUpdate()->findOrFail($orderId);

        if ($result === 'ok') {
            $tx = null;

            DB::transaction(function () use (&$tx, $order) {
                if ($order->status !== 'paid') {
                    $order->update(['status' => 'paid', 'paid_at' => now()]);

                    $tx = $order->transactions()->create([
                        'user_id'        => $order->user_id,
                        'amount'         => $order->total_amount,
                        'currency'       => $order->currency,
                        'status'         => 'paid',
                        'payment_method' => $this->name(),
                        'ref_number'     => 'SANDBOX-'.now()->timestamp.'-'.$order->id,
                        'raw_payload'    => null,
                    ]);
                }
            });

            event(new OrderPaid($order, $tx?->ref_number, ['driver' => $this->name()]));

            return [
                'ok'       => true,
                'redirect' => route('api.v1.payments.success', ['order' => $order->id]),
            ];
        }

        if ($order->status === 'pending') {
            $order->update(['status' => 'failed']);
            $order->transactions()->create([
                'user_id'        => $order->user_id,
                'amount'         => $order->total_amount,
                'currency'       => $order->currency,
                'status'         => 'failed',
                'payment_method' => $this->name(),
                'ref_number'     => null,
                'raw_payload'    => null,
            ]);
        }

        return [
            'ok'       => false,
            'redirect' => route('api.v1.payments.failed', ['order' => $order->id]),
        ];
    }
}
