<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Order;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function pay(Order $order, PaymentManager $pm, Request $r)
    {
        $driver = $r->query('driver', 'sandbox');
        $gate   = $pm->driver($driver);

        $res = $gate->pay($order);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Redirect to gateway',
            'data'    => $res,
        ]);
    }

    public function callback(Request $r, string $driver, PaymentManager $pm)
    {
        $res = $pm->driver($driver)->callback($r);

        if (!empty($res['redirect'])) {
            return redirect()->to($res['redirect']);
        }

        return response()->json([
            'code'    => $res['ok'] ? 'OK' : 'FAILED',
            'message' => $res['ok'] ? 'Payment success' : 'Payment failed',
            'data'    => $res,
        ], $res['ok'] ? 200 : 422);
    }

    public function success(Request $r)
    {
        return response()->json(['code'=>'OK','message'=>'Payment completed','data'=>[
            'order_id' => (int) $r->query('order'),
        ]]);
    }

    public function failed(Request $r)
    {
        return response()->json(['code'=>'FAILED','message'=>'Payment failed','data'=>[
            'order_id' => (int) $r->query('order'),
        ]], 422);
    }

    // شبیه‌ساز Sandbox (GET /payments/sandbox/callback?order=...&result=ok|fail)
    public function sandboxCallback(Request $r, PaymentManager $pm)
    {
        $res = $pm->driver('sandbox')->callback($r); // 👈 همین

        if (!empty($res['redirect'])) {
            return redirect()->to($res['redirect']);
        }

        return response()->json([
            'code'    => $res['ok'] ? 'OK' : 'FAILED',
            'message' => $res['ok'] ? 'Payment success' : 'Payment failed',
            'data'    => $res,
        ], $res['ok'] ? 200 : 422);
    }
}
