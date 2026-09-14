<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CouponController extends Controller
{
    public function __construct()
    {
        // Require admin role via sanctum API guard (consistent with other Admin controllers)
        $this->middleware(['auth:sanctum', 'role:admin|Administrator,api']);
    }

    public function index(Request $r)
    {
        $q = Coupon::query()->withCount(['redemptions as used' => function($qq){}]);

        if ($search = $r->query('q')) {
            $q->where('code','like',"%{$search}%");
        }

        if ($type = $r->query('type')) { // percent|fixed
            // map possible 'percentage' alias to 'percent'
            if ($type === 'percentage') { $type = 'percent'; }
            $q->where('type', $type);
        }

        // status filter: active|scheduled|expired|disabled (computed)
        if ($status = $r->query('status')) {
            $now = Carbon::now();
            $q->where(function($qq) use ($status, $now) {
                if ($status === 'disabled') {
                    $qq->where('is_active', false);
                } elseif ($status === 'scheduled') {
                    $qq->where('is_active', true)->where('starts_at', '>', $now);
                } elseif ($status === 'expired') {
                    $qq->where('is_active', true)->whereNotNull('ends_at')->where('ends_at', '<', $now);
                } elseif ($status === 'active') {
                    $qq->where('is_active', true)->where(function($q2) use ($now) {
                        $q2->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
                    })->where('starts_at', '<=', $now);
                }
            });
        }

        $perPage = $r->integer('per_page', 50);
        $coupons = $q->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'code' => 'OK',
            'message' => 'Coupons list',
            'data' => $coupons->getCollection()->map(function(Coupon $c) {
                return $this->toAdminRow($c);
            }),
            'meta' => [
                'current_page' => $coupons->currentPage(),
                'per_page' => $coupons->perPage(),
                'total' => $coupons->total(),
            ],
        ]);
    }

    public function store(Request $req)
    {
        $data = $this->validatePayload($req);

        $coupon = new Coupon();
        $this->fillModel($coupon, $data);
        $coupon->save();

        // preload used count
        $coupon->loadCount(['redemptions as used']);

        return response()->json([
            'code' => 'OK',
            'message' => 'Coupon created',
            'data' => $this->toAdminRow($coupon),
        ], 201);
    }

    public function show(Coupon $coupon)
    {
        $coupon->loadCount(['redemptions as used']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Coupon detail',
            'data' => $this->toAdminRow($coupon),
        ]);
    }

    public function update(Request $req, Coupon $coupon)
    {
        $data = $this->validatePayload($req, true);
        $this->fillModel($coupon, $data);
        $coupon->save();
        $coupon->loadCount(['redemptions as used']);

        return response()->json([
            'code' => 'OK',
            'message' => 'Coupon updated',
            'data' => $this->toAdminRow($coupon),
        ]);
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();
        return response()->json([
            'code' => 'OK',
            'message' => 'Coupon deleted',
            'data' => null,
        ]);
    }

    public function activate(Coupon $coupon)
    {
        $coupon->is_active = true;
        $coupon->save();
        $coupon->loadCount(['redemptions as used']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Coupon activated',
            'data' => $this->toAdminRow($coupon),
        ]);
    }

    public function deactivate(Coupon $coupon)
    {
        $coupon->is_active = false;
        $coupon->save();
        $coupon->loadCount(['redemptions as used']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Coupon deactivated',
            'data' => $this->toAdminRow($coupon),
        ]);
    }

    private function validatePayload(Request $req, bool $partial = false): array
    {
        $rules = [
            'code'            => [$partial ? 'sometimes' : 'required','string','max:50'],
            'type'            => [$partial ? 'sometimes' : 'required','string','in:percent,fixed,percentage'],
            'value'           => [$partial ? 'sometimes' : 'required','numeric','min:0'],
            'starts_at'       => [$partial ? 'sometimes' : 'required','date'],
            'ends_at'         => ['nullable','date'],
            'is_active'       => ['sometimes','boolean'],
            'max_uses'        => ['nullable','integer','min:0'],
            'per_user_limit'  => ['nullable','integer','min:1'],
            'target_rule'     => ['nullable','array'],
        ];

        $data = $req->validate($rules);
        // Normalize 'percentage' alias
        if (isset($data['type']) && $data['type'] === 'percentage') {
            $data['type'] = 'percent';
        }
        return $data;
    }

    private function fillModel(Coupon $c, array $data): void
    {
        // Allow partial fill
        $fields = ['code','type','value','starts_at','ends_at','is_active','max_uses','per_user_limit','target_rule'];
        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                $c->{$f} = $data[$f];
            }
        }
    }

    private function toAdminRow(Coupon $c): array
    {
        return [
            'id'           => $c->id,
            'code'         => $c->code,
            // Expose UI-friendly alias 'percentage' while keeping backend as 'percent'
            'type'         => $c->type === 'percent' ? 'percentage' : $c->type,
            'value'        => (float) $c->value,
            'starts_at'    => optional($c->starts_at)->toIso8601String(),
            'ends_at'      => optional($c->ends_at)->toIso8601String(),
            'is_active'    => (bool) $c->is_active,
            'max_uses'     => $c->max_uses,
            'per_user_limit' => $c->per_user_limit,
            'used'         => (int) ($c->used ?? 0),
            'target_rule'  => $c->target_rule,
            'created_at'   => optional($c->created_at)->toIso8601String(),
            'updated_at'   => optional($c->updated_at)->toIso8601String(),
        ];
    }
}
