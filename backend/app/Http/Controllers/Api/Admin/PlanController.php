<?php
// app/Http/Controllers/Api/Admin/PlanController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Billing\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlanController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin']);
    }

    public function index(Request $r)
    {
        $q = SubscriptionPlan::query()->orderByDesc('id');
        if ($s = $r->query('q')) $q->where('name','like',"%$s%");
        $plans = $q->paginate($r->integer('per_page',20));

        return response()->json([
            'code'=>'OK','message'=>'Plans','data'=>$plans
        ]);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'name' => ['required','string','max:100'],
            'slug' => ['nullable','string','max:120','unique:subscription_plans,slug'],
            'description' => ['nullable','string'],
            'price' => ['required','numeric','min:0'],
            'currency' => ['nullable','string','max:10'],
            'duration_days' => ['required','integer','min:1'],
            'token_quota' => ['required','integer','min:0'],
            'is_active' => ['boolean'],
        ]);
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $plan = SubscriptionPlan::create($data);

        return response()->json(['code'=>'OK','message'=>'Plan created','data'=>$plan],201);
    }

    public function show(SubscriptionPlan $plan)
    {
        return response()->json(['code'=>'OK','message'=>'Plan','data'=>$plan]);
    }

    public function update(Request $r, SubscriptionPlan $plan)
    {
        $data = $r->validate([
            'name' => ['sometimes','string','max:100'],
            'slug' => ['sometimes','string','max:120','unique:subscription_plans,slug,'.$plan->id],
            'description' => ['nullable','string'],
            'price' => ['sometimes','numeric','min:0'],
            'currency' => ['sometimes','string','max:10'],
            'duration_days' => ['sometimes','integer','min:1'],
            'token_quota' => ['sometimes','integer','min:0'],
            'is_active' => ['sometimes','boolean'],
        ]);
        $plan->update($data);

        return response()->json(['code'=>'OK','message'=>'Plan updated','data'=>$plan]);
    }

    public function destroy(SubscriptionPlan $plan)
    {
        $plan->delete();
        return response()->json(['code'=>'OK','message'=>'Plan deleted','data'=>null]);
    }
}
