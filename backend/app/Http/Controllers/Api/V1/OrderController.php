<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commerce\OrderCreateRequest;
use App\Models\Commerce\Order;
use App\Services\Commerce\CouponService;
use App\Services\Commerce\PricingService;
use App\Services\Commerce\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum']);
    }

    public function index(Request $r)
    {
        $perPage = (int) $r->integer('per_page', 20);

        $rows = Order::query()
            ->where('user_id', $r->user()->id)
            ->with(['items' => function($q){
                $q->select('id','order_id','item_type','item_id','qty','unit_price','total_price');
            }])
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'code' => 'OK',
            'message' => 'My orders',
            'data' => $rows->through(function (Order $o) {
                return [
                    'id'           => $o->id,
                    'status'       => $o->status,          // pending|paid|failed|refunded|cancelled
                    'total_amount' => (int) $o->total_amount,
                    'currency'     => $o->currency,
                    'paid_at'      => optional($o->paid_at)->toDateTimeString(),
                    'created_at'   => optional($o->created_at)->toDateTimeString(),
                    'items'        => $o->items->map(fn($it)=>[
                        'id'          => $it->id,
                        'type'        => $it->item_type,   // plan
                        'item_id'     => $it->item_id,
                        'qty'         => (int) $it->qty,
                        'unit_price'  => (int) $it->unit_price,
                        'total_price' => (int) $it->total_price,
                    ]),
                ];
            }),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'per_page'     => $rows->perPage(),
                'total'        => $rows->total(),
            ],
        ]);
    }

    public function store(
        OrderCreateRequest $req,
        PricingService $pricing,
        CouponService $coupons,
        WalletService $wallets
    ) {
        $user   = $req->user();
        $items  = $req->validated()['items'];
        $curr   = $req->input('currency','IRR');

        // subtotal
        $subtotal = $pricing->subtotal($items);
        if ($subtotal <= 0) {
            return response()->json(['code'=>'INVALID','message'=>'Subtotal is zero'], 422);
        }

        // coupon
        $couponRes = $coupons->validateAndPrice($req->input('coupon_code'), $user, $subtotal, $items);
        $discount  = (int) $couponRes['discount'];
        $couponId  = $couponRes['coupon']?->id;

        // pay amount before wallet
        $beforeWallet = max(0, $subtotal - $discount);

        // wallet
        $applyWallet = 0;
        if ($req->boolean('wallet_use')) {
            $applyWallet = $wallets->reserve($user, 0, $beforeWallet); // orderId=0 موقت؛ بعد از ساخت سفارش Update می‌کنیم
        } elseif ($req->filled('wallet_amount')) {
            $applyWallet = $wallets->reserve($user, 0, (int)$req->input('wallet_amount'));
        }

        // clamp
        $applyWallet = min($applyWallet, $beforeWallet);
        $toPay       = max(0, $beforeWallet - $applyWallet);

        // ساخت سفارش + آیتم‌ها + متا
        $order = DB::transaction(function () use ($user,$items,$pricing,$subtotal,$discount,$applyWallet,$toPay,$couponId,$curr) {
            $order = Order::create([
                'user_id'      => $user->id,
                'status'       => $toPay === 0 ? 'paid' : 'pending',
                'total_amount' => $toPay,
                'currency'     => $curr,
                'paid_at'      => $toPay === 0 ? now() : null,
                'meta'         => [
                    'subtotal'       => $subtotal,
                    'discount'       => $discount,
                    'wallet_applied' => $applyWallet,
                    'coupon_id'      => $couponId,
                ],
            ]);

            $rows = $pricing->buildOrderItems($items);
            foreach ($rows as $r) {
                $order->items()->create($r);
            }
            return $order->fresh(['items']);
        });

        // آپدیت رزرو کیف‌پول به order_id واقعی
        if ($applyWallet > 0) {
            // آزاد کن رزرو قبلی (order_id=0) و دوباره با order_id واقعی رزرو کن
            $wallets->release($user, 0);
            $wallets->reserve($user, $order->id, $applyWallet);
        }

        // اگر مبلغ نهایی صفر شد، همین‌جا OrderPaid را تریگر کن
        if ($order->status === 'paid') {
            event(new \App\Events\OrderPaid($order, 'WALLET-ONLY', ['driver'=>'wallet']));
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Order created',
            'data'    => [
                'order_id'  => $order->id,
                'status'    => $order->status,
                'amounts'   => [
                    'currency'       => $curr,
                    'subtotal'       => $subtotal,
                    'discount'       => $discount,
                    'wallet_applied' => $applyWallet,
                    'pay_amount'     => $toPay,
                ],
                'items'     => $order->items->map(fn($it)=>[
                    'type' => $it->item_type,
                    'id'   => (int)$it->item_id,
                    'qty'  => (int)$it->qty,
                    'unit' => (int)$it->unit_price,
                    'total'=> (int)$it->total_price,
                ]),
            ],
        ], 201);
    }

    public function show(Request $r, Order $order)
    {
        abort_if($order->user_id !== $r->user()->id, 403);

        return response()->json([
            'code'=>'OK',
            'message'=>'Order detail',
            'data'=>[
                'id'     => $order->id,
                'status' => $order->status,
                'amount' => (int)$order->total_amount,
                'currency'=>$order->currency,
                'meta'   => $order->meta,
                'items'  => $order->items()->get(['item_type','item_id','qty','unit_price','total_price']),
            ],
        ]);
    }
}
