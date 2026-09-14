<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commerce\CheckoutRequest;
use App\Models\Commerce\Order;
use App\Services\Commerce\CheckoutService;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\Request;
use App\Events\OrderPaid;

class CheckoutController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum']);
    }

    public function store(
        CheckoutRequest $req,
        CheckoutService $checkout,
        PaymentManager $payments
    ) {
        $user   = $req->user();
        $planId = (int) $req->input('plan_id');
        $qty    = (int) $req->input('qty', 1);
        $coupon = $req->input('coupon_code');
        $wallet = $req->input('wallet_amount');
        $gateway= $req->input('gateway', config('payments.default', 'sandbox'));
        $return = $req->input('return_url');

        $res = $checkout->createOrder($user, $planId, $qty, $coupon, $wallet, $gateway, $return);

        $order   = $res['order'];
        $payable = $res['pricing']['payable'];

        $payUrl = null;
        if ($payable > 0) {
            $driver = $payments->driver($gateway);
            $payUrl = $driver->start($order, [
                'return_url' => $return,
                'description'=> 'خرید پلن '.$order->items->first()?->plan?->name ?? ('Order#'.$order->id),
            ]);
        } else {
            // پرداختی ندارد → فرایند «پرداخت موفق» را مستقیماً هدایت می‌کنیم
            $driver = $payments->driver('sandbox');
            $payUrl = $driver->simulateZeroPay($order);
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Order created',
            'data'    => [
                'order_id' => $order->id,
                'pricing'  => $res['pricing'],
                'pay_url'  => $payUrl,
                'gateway'  => $gateway,
            ],
        ], 201);
    }

    public function show(Request $r, Order $order)
    {
        abort_if($order->user_id !== $r->user()->id, 403);

        $order->load(['items.plan','transactions']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Order detail',
            'data' => [
                'id'           => $order->id,
                'status'       => $order->status,
                'total_amount' => (float)$order->total_amount,
                'currency'     => $order->currency,
                'paid_at'      => optional($order->paid_at)->toDateTimeString(),
                'items'        => $order->items->map(fn($it)=>[
                    'id'   => $it->id,
                    'type' => $it->item_type,
                    'title'=> $it->plan?->name,
                    'qty'  => $it->qty,
                    'unit_price' => (float)$it->unit_price,
                    'total_price'=> (float)$it->total_price,
                ]),
                'transactions' => $order->transactions->map(fn($t)=>[
                    'id' => $t->id,
                    'method' => $t->payment_method,
                    'status' => $t->status,
                    'amount' => (float)$t->amount,
                    'ref'    => $t->ref_number,
                ]),
            ]
        ]);
    }

    /**
     * Free checkout - creates order and marks as paid immediately (no payment gateway)
     * For development/testing until payment gateway is ready
     */
    public function storeFree(CheckoutRequest $req, CheckoutService $checkout)
    {
        $user   = $req->user();
        $planId = (int) $req->input('plan_id');
        $qty    = (int) $req->input('qty', 1);
        $coupon = $req->input('coupon_code');

        // Create order with no wallet, no gateway
        $res = $checkout->createOrder($user, $planId, $qty, $coupon, null, 'free', null);
        $order = $res['order'];

        // Mark order as paid immediately
        $order->update([
            'status'  => 'paid',
            'paid_at' => now(),
        ]);

        // Update all pending transactions to paid
        $order->transactions()->where('status', 'pending')->update([
            'status'     => 'paid',
            'ref_number' => 'FREE-' . strtoupper(substr(md5($order->id . time()), 0, 10)),
        ]);

        // Fire OrderPaid event to activate subscriptions
        event(new OrderPaid($order, 'FREE-CHECKOUT'));

        // Reload order with relations
        $order->load(['items.plan', 'transactions']);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Order created and activated successfully',
            'data'    => [
                'order_id'     => $order->id,
                'status'       => $order->status,
                'paid_at'      => $order->paid_at->toDateTimeString(),
                'total_amount' => (float) $order->total_amount,
                'pricing'      => $res['pricing'],
                'items'        => $order->items->map(fn($it) => [
                    'plan_id'   => $it->item_id,
                    'plan_name' => $it->plan?->name,
                    'qty'       => $it->qty,
                    'price'     => (float) $it->total_price,
                ]),
            ],
        ], 201);
    }
}
