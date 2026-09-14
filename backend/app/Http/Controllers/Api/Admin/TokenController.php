<?php
// app/Http/Controllers/Api/Admin/TokenController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Tokens\TokenService;
use Illuminate\Http\Request;

class TokenController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin']);
    }

    public function topup(Request $r, TokenService $tokens)
    {
        $data = $r->validate([
            'user_id' => ['required','exists:users,id'],
            'amount'  => ['required','integer','min:1'],
            'plan_id' => ['nullable','integer','exists:subscription_plans,id'],
            'valid_until' => ['nullable','date'],
        ]);
        $user = User::findOrFail($data['user_id']);
        $tokens->addTokens($user, (int)$data['amount'], $data['plan_id'] ?? null, $data['valid_until'] ?? null);

        return response()->json(['code'=>'OK','message'=>'Tokens added','data'=>['remain'=>$tokens->remain($user)]],201);
    }
}
