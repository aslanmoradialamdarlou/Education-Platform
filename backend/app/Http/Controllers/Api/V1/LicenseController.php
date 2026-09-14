<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\IssueSpotPlayerLicense;
use App\Models\Media\VideoLicense;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LicenseController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum']);
    }

    public function index(Request $r)
    {
        $rows = VideoLicense::where('user_id', $r->user()->id)
            ->orderByDesc('id')
            ->paginate($r->integer('per_page', 20));

        return response()->json([
            'code'=>'OK',
            'message'=>'My video licenses',
            'data'=> $rows->through(fn(VideoLicense $v)=>[
                'id'          => $v->id,
                'content_id'  => $v->content_id,
                'name'        => $v->name,
                'status'      => $v->status, // pending|active|failed|revoked|expired
                'license_id'  => $v->license_id,
                'license_key' => $v->license_key ? (substr($v->license_key, 0, 8).'…'.substr($v->license_key, -6)) : null,
                'url'         => $v->url,
                'starts_at'   => optional($v->starts_at)->toDateTimeString(),
                'ends_at'     => optional($v->ends_at)->toDateTimeString(),
                'meta'        => $v->meta ?? [],
            ]),
            'meta'=>[
                'current_page'=>$rows->currentPage(),
                'per_page'    =>$rows->perPage(),
                'total'       =>$rows->total(),
            ]
        ]);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'content_id'     => ['nullable','integer','exists:contents,id'],
            'courses'        => ['required','array','min:1'],
            'courses.*'      => ['string','max:64'],
            'name'           => ['nullable','string','max:150'],
            'watermark_text' => ['nullable','string','max:100'],
            'test'           => ['nullable','boolean'],
            'payload'        => ['nullable','string','max:200'],
            'device'         => ['nullable','array'],
            'data'           => ['nullable','array'],
            'offline'        => ['nullable','integer','between:1,3600'],
        ]);

        // جلوگیری از Duplicate (برای هر کاربر روی یک content)
        if (!empty($data['content_id'])) {
            $exists = VideoLicense::where('user_id', $r->user()->id)
                ->where('content_id', $data['content_id'])
                ->whereIn('status', ['pending','active'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'code' => 'DUP',
                    'message' => 'License already exists for this content.',
                    'data' => null,
                ], 409);
            }
        }

        $watermark = $data['watermark_text'] ?? ($r->user()->phone ?? $r->user()->email ?? config('spotplayer.watermark_fallback'));

        $lic = VideoLicense::create([
            'user_id'   => $r->user()->id,
            'content_id'=> $data['content_id'] ?? null,
            'name'      => $data['name'] ?? ($r->user()->name ?? 'customer'),
            'courses'   => $data['courses'],
            'test'      => (bool) ($data['test'] ?? config('spotplayer.test')),
            'watermark' => ['texts' => [['text' => $watermark]]],
            'device'    => $data['device'] ?? null,
            'payload'   => $data['payload'] ?? null,
            'meta'      => array_filter([
                'data'    => $data['data'] ?? null,
                'offline' => $data['offline'] ?? null,
            ], fn($v)=>!is_null($v)),
            'status'    => 'pending',
            'starts_at' => now(),         // نسخه قدیمی جدولت start_date داشت → اگر هنوز هست fill کن
            // 'start_date' => now()->toDateString(),
        ]);

        IssueSpotPlayerLicense::dispatch($lic->id)->onQueue('default');

        return response()->json([
            'code'=>'ACCEPTED',
            'message'=>'License issuing queued',
            'data'=>[
                'license_id' => $lic->id,
                'status'     => $lic->status,
            ],
        ], 202);
    }

    public function show(Request $r, VideoLicense $license)
    {
        abort_if($license->user_id !== $r->user()->id, 403);

        return response()->json([
            'code'=>'OK',
            'message'=>'License detail',
            'data'=>[
                'id'          => $license->id,
                'content_id'  => $license->content_id,
                'name'        => $license->name,
                'status'      => $license->status,
                'license_id'  => $license->license_id,
                'license_key' => $license->license_key,
                'url'         => $license->url,
                'starts_at'   => optional($license->starts_at)->toDateTimeString(),
                'ends_at'     => optional($license->ends_at)->toDateTimeString(),
                'watermark'   => $license->watermark,
                'device'      => $license->device,
                'payload'     => $license->payload,
                'meta'        => $license->meta,
                'created_at'  => optional($license->created_at)->toDateTimeString(),
                'updated_at'  => optional($license->updated_at)->toDateTimeString(),
            ]
        ]);
    }

    /** Retry دستی برای failed/pending */
    public function retry(Request $r, VideoLicense $license)
    {
        abort_if($license->user_id !== $r->user()->id, 403);

        if ($license->status === 'active' && $license->license_key) {
            return response()->json(['code'=>'ALREADY_ISSUED','message'=>'License is already active','data'=>null], 200);
        }

        // ریست وضعیت به pending و پرتاب Job
        $license->update(['status'=>'pending']);
        IssueSpotPlayerLicense::dispatch($license->id)->onQueue('default');

        return response()->json(['code'=>'ACCEPTED','message'=>'Retry queued','data'=>['license_id'=>$license->id]], 202);
    }
}
