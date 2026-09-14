<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Billing\TokenPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TokenPackageController extends Controller
{
    public function index()
    {
        Gate::authorize('admin.access');

        $packages = TokenPackage::orderBy('tokens', 'asc')->get();

        return response()->json([
            'code' => 'OK',
            'message' => 'Token packages list',
            'data' => $packages,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('admin.access');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tokens' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'integer', 'min:0'],
        ]);

        $package = TokenPackage::create($data);

        return response()->json([
            'code' => 'OK',
            'message' => 'Token package created',
            'data' => $package,
        ], 201);
    }

    public function update(Request $request, TokenPackage $tokenPackage)
    {
        Gate::authorize('admin.access');

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'tokens' => ['sometimes', 'integer', 'min:1'],
            'price' => ['sometimes', 'integer', 'min:0'],
        ]);

        $tokenPackage->update($data);

        return response()->json([
            'code' => 'OK',
            'message' => 'Token package updated',
            'data' => $tokenPackage->fresh(),
        ]);
    }

    public function destroy(TokenPackage $tokenPackage)
    {
        Gate::authorize('admin.access');

        $tokenPackage->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Token package deleted',
        ]);
    }
}
