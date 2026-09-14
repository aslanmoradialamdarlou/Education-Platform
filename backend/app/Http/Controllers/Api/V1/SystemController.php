<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    public function health()
    {
        try {
            DB::select('SELECT 1');
            $db = 'ok';
        } catch (\Throwable $e) {
            $db = 'down';
        }

        return response()->json([
            'status' => 'ok',
            'db'     => $db,
            'time'   => now()->toIso8601String(),
        ]);
    }

    public function version()
    {
        return response()->json([
            'app'      => config('app.name'),
            'env'      => config('app.env'),
            'version'  => config('app.version', '0.1.0'),
            'commit'   => trim((string) @exec('git rev-parse --short HEAD')) ?: null,
            'time'     => now()->toIso8601String(),
        ]);
    }
}
