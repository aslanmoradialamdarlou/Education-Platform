<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\HeaderTemplateStoreRequest;
use App\Http\Requests\Admin\HeaderTemplateUpdateRequest;
use App\Http\Resources\Admin\HeaderTemplateResource;use App\Models\Exam\HeaderTemplate;
use Illuminate\Http\Request;

class HeaderTemplateController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum','role:admin']);
        // یا: $this->middleware('permission:exam.templates.manage');
    }

    public function index(Request $r)
    {
        $q = HeaderTemplate::query()->orderByDesc('id');
        if ($s = $r->query('q')) $q->where('name','like',"%{$s}%");

        $per = $r->integer('per_page', 20);
        $items = $q->paginate($per);

        return response()->json([
            'code' => 'OK',
            'message' => 'Header templates list',
            'data' => HeaderTemplateResource::collection($items),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page'     => $items->perPage(),
                'total'        => $items->total(),
            ],
        ]);
    }

    public function store(HeaderTemplateStoreRequest $req)
    {
        $tpl = HeaderTemplate::create($req->validated());

        return response()->json([
            'code' => 'OK',
            'message' => 'Header template created',
            'data' => new HeaderTemplateResource($tpl),
        ], 201);
    }

    public function show(HeaderTemplate $header_template)
    {
        return response()->json([
            'code' => 'OK',
            'message' => 'Header template detail',
            'data' => new HeaderTemplateResource($header_template),
        ]);
    }

    public function update(HeaderTemplateUpdateRequest $req, HeaderTemplate $header_template)
    {
        $header_template->update($req->validated());

        return response()->json([
            'code' => 'OK',
            'message' => 'Header template updated',
            'data' => new HeaderTemplateResource($header_template),
        ]);
    }

    public function destroy(HeaderTemplate $header_template)
    {
        // اگر در امتحان‌ها استفاده شده باشد می‌توانید بلاک کنید (Optional)
        // if ($header_template->exams()->exists()) return response()->json([...], 409);

        $header_template->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Header template deleted',
            'data' => null,
        ]);
    }
}
