<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Handout;
use App\Models\HandoutEvent;
use Illuminate\Http\Request;

class HandoutController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
    }

    public function index(Request $r)
    {
        $q = Handout::query()->orderByDesc('id');
        if ($r->filled('q')) $q->where('title','like','%'.$r->query('q').'%');
        $per = $r->integer('per_page', 20);
        $items = $q->paginate($per);
        return response()->json(['code' => 'OK', 'message' => 'Handouts', 'data' => \App\Http\Resources\PaginationResource::make($items)]);
    }

    public function store(Request $r)
    {
        $this->normalizeCamelKeys($r);
        $data = $r->validate([
            'title' => ['required','string','max:255'],
            'pdf_url' => ['nullable','string','max:2000'],
            'description' => ['nullable','string'],
            'pages' => ['nullable','integer'],
            'price' => ['nullable','integer'],
            'teacher' => ['nullable','string','max:255'],
            'grade' => ['nullable','string','max:50'],
            'subject' => ['nullable','string','max:255'],
            'chapter' => ['nullable','string','max:255'],
            'access_type' => ['nullable','string','in:free,paid'],
            'status' => ['nullable','string','in:draft,published,revoked'],
        ]);

        $h = Handout::create(array_merge($data, ['added_date' => now()]));

        return response()->json(['code' => 'OK', 'message' => 'Created', 'data' => $h], 201);
    }

    public function show(Handout $handout)
    {
        return response()->json(['code' => 'OK', 'message' => 'Handout', 'data' => $handout]);
    }

    public function update(Request $r, Handout $handout)
    {
        $this->normalizeCamelKeys($r);
        $data = $r->validate([
            'title' => ['sometimes','string','max:255'],
            'pdf_url' => ['sometimes','nullable','string','max:2000'],
            'description' => ['sometimes','nullable','string'],
            'pages' => ['sometimes','nullable','integer'],
            'price' => ['sometimes','nullable','integer'],
            'teacher' => ['sometimes','nullable','string','max:255'],
            'grade' => ['sometimes','nullable','string','max:50'],
            'subject' => ['sometimes','nullable','string','max:255'],
            'chapter' => ['sometimes','nullable','string','max:255'],
            'access_type' => ['sometimes','nullable','string','in:free,paid'],
            'status' => ['sometimes','nullable','string','in:draft,published,revoked'],
        ]);
        $handout->update($data);
        return response()->json(['code' => 'OK', 'message' => 'Updated', 'data' => $handout]);
    }

    /**
     * Accept payloads that may use camelCase keys (from JS frontend) and
     * normalize them to the snake_case keys our validators / model expect.
     */
    protected function normalizeCamelKeys(Request $r)
    {
        $map = [
            'pdfUrl' => 'pdf_url',
            'teacherGuideUrl' => 'teacher_guide_url',
            'classSummaryUrl' => 'class_summary_url',
            'accessType' => 'access_type',
            'accessRevoked' => 'access_revoked',
            'addedDate' => 'added_date',
        ];
        $input = $r->all();
        $changed = [];
        foreach ($map as $camel => $snake) {
            if (array_key_exists($camel, $input) && !array_key_exists($snake, $input)) {
                $changed[$snake] = $input[$camel];
            }
        }
        if (!empty($changed)) {
            $r->merge($changed);
        }
    }

    public function destroy(Handout $handout)
    {
        $handout->delete();
        return response()->json(['code' => 'OK', 'message' => 'Deleted', 'data' => null]);
    }

    /**
     * GET /v1/admin/handouts/{handout}/stats
     * Returns simple aggregates for views/downloads (total and last 7 days).
     */
    public function stats(Handout $handout)
    {
        $now = now();
        $since = $now->copy()->subDays(7);

        $base = HandoutEvent::query()->where('handout_id', $handout->id);
        $downloadsTotal = (clone $base)->where('event_type','download')->count();
        $downloads7d    = (clone $base)->where('event_type','download')->where('created_at', '>=', $since)->count();
        $viewsTotal     = (clone $base)->where('event_type','view')->count();
        $views7d        = (clone $base)->where('event_type','view')->where('created_at', '>=', $since)->count();

        return response()->json([
            'code' => 'OK',
            'message' => 'Handout stats',
            'data' => [
                'downloads_total' => $downloadsTotal,
                'downloads_7d'    => $downloads7d,
                'views_total'     => $viewsTotal,
                'views_7d'        => $views7d,
            ],
        ]);
    }
}
