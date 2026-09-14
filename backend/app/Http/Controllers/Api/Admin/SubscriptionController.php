<?php
// app/Http/Controllers/Api/Admin/SubscriptionController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Billing\Subscription;
use App\Models\Billing\SubscriptionPlan;
use App\Models\User;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin']);
    }

    public function index(Request $r)
    {
        $q = Subscription::query()->with(['user:id,first_name,last_name,phone','plan:id,name,slug'])->orderByDesc('id');
        if ($r->filled('user_id')) $q->where('user_id',$r->integer('user_id'));
        if ($r->filled('status')) $q->where('status',$r->string('status'));
        $items = $q->paginate($r->integer('per_page',20));

        return response()->json(['code'=>'OK','message'=>'Subscriptions','data'=>$items]);
    }

    public function store(Request $r, SubscriptionService $svc)
    {
        $data = $r->validate([
            'user_id' => ['required','exists:users,id'],
            'plan_id' => ['required','exists:subscription_plans,id'],
            'start'   => ['nullable','date'],
        ]);

        $user = User::findOrFail($data['user_id']);
        $plan = SubscriptionPlan::findOrFail($data['plan_id']);

        $sub = $svc->activatePlan($user,$plan,$data['start'] ?? null);

        return response()->json(['code'=>'OK','message'=>'Activated','data'=>$sub],201);
    }

    public function show(Subscription $subscription)
    {
        $subscription->load(['user:id,first_name,last_name,phone','plan:id,name,slug']);
        return response()->json(['code'=>'OK','message'=>'Subscription','data'=>$subscription]);
    }

    public function update(Request $r, Subscription $subscription)
    {
        $data = $r->validate([
            'status' => ['required','in:active,expired,cancelled,pending'],
            'end_date' => ['nullable','date'],
        ]);
        $subscription->update($data);
        return response()->json(['code'=>'OK','message'=>'Updated','data'=>$subscription]);
    }

    public function destroy(Subscription $subscription)
    {
        $subscription->delete();
        return response()->json(['code'=>'OK','message'=>'Deleted','data'=>null]);
    }
}
