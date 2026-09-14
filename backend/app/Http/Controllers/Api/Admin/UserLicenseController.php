<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media\VideoLicense;
use App\Models\User;
use Illuminate\Http\Request;

class UserLicenseController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
    }

    /** GET /api/v1/admin/users/{user}/video-licenses */
    public function index(Request $r, User $user)
    {
        $perPage = (int) $r->integer('per_page', 20);
        $rows = VideoLicense::query()
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->paginate($perPage);

        $items = $rows->through(function (VideoLicense $lic) {
            return [
                'id'         => $lic->id,
                'name'       => $lic->name,
                'courses'    => $lic->courses,
                'test'       => (bool)$lic->test,
                'key'        => $lic->license_key,
                'url'        => $lic->url,
                'status'     => $lic->status,
                'created_at' => optional($lic->created_at)->toDateTimeString(),
                'starts_at'  => optional($lic->starts_at)->toDateTimeString(),
                'ends_at'    => optional($lic->ends_at)->toDateTimeString(),
            ];
        });

        return response()->json([
            'code'    => 'OK',
            'message' => 'Video licenses',
            'data'    => $items,
            'meta'    => [
                'current_page' => $rows->currentPage(),
                'per_page'     => $rows->perPage(),
                'total'        => $rows->total(),
            ],
        ]);
    }
}
