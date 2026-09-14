<?php
// app/Http/Controllers/Api/Admin/VideoLicenseController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media\VideoLicense;
use App\Models\User;
use App\Services\Media\SpotPlayerService;
use Illuminate\Http\Request;

class VideoLicenseController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin']);
    }

    public function store(Request $r, SpotPlayerService $spot)
    {
        $data = $r->validate([
            'user_id' => ['required','exists:users,id'],
            'courses' => ['required','array','min:1'],   // آرایه course IDs
            'name'    => ['nullable','string','max:150'],
            'test'    => ['boolean'],
            'watermark_text' => ['required','string','max:80'],
            'payload' => ['nullable','string','max:200'],
        ]);

        $user = User::findOrFail($data['user_id']);

        $payload = [
            'test'   => (bool)($data['test'] ?? false),
            'course' => array_values($data['courses']),
            'name'   => $data['name'] ?? ($user->first_name.' '.$user->last_name ?: $user->phone ?: 'customer'),
            'payload'=> $data['payload'] ?? null,
            'watermark' => ['texts' => [ ['text' => $data['watermark_text']] ]],
        ];

        $res = $spot->createLicense($payload);
        // $res: _id, key, url

        $lic = VideoLicense::create([
            'user_id'    => $user->id,
            'license_id' => $res['_id'] ?? null,
            'license_key'=> $res['key'] ?? null,
            'url'        => $res['url'] ?? null,
            'name'       => $payload['name'],
            'courses'    => $payload['course'],
            'test'       => (bool)$payload['test'],
            'watermark'  => $payload['watermark'],
            'payload'    => $payload['payload'] ?? null,
            'status'     => 'active',
            'meta'       => ['endpoint'=>config('services.spotplayer.endpoint')],
        ]);

        return response()->json([
            'code'=>'OK',
            'message'=>'License created',
            'data'=>[
                'id'  => $lic->id,
                'key' => $lic->license_key,
                'url' => rtrim(config('services.spotplayer.dl'),'/').($lic->url ?? ''),
            ],
        ], 201);
    }
}
