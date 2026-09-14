<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\Curriculum\Subchapter;
use App\Http\Requests\Admin\SubchapterUpdateRequest;
use App\Http\Resources\Admin\SubchapterResource;

class SubchapterController extends Controller
{
    public function index(Request $r)
    {
        Gate::authorize('catalog.manage');

        $q = Subchapter::query()
            ->with(['chapter.book'])
            ->withCount('contents')
            ->orderBy('chapter_id')->orderBy('number');

        if ($r->filled('chapter_id')) {
            $q->where('chapter_id', $r->integer('chapter_id'));
        }
        if ($search = $r->query('q')) {
            $q->where('title','like',"%{$search}%");
        }

        $rows = $q->paginate($r->integer('per', 20));

        return response()->json([
            'code' => 'OK',
            'message' => 'Subchapters list',
            'data' => SubchapterResource::collection($rows),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'per_page'     => $rows->perPage(),
                'total'        => $rows->total(),
            ],
        ]);
    }

    public function store(Request $r)
    {
        Gate::authorize('catalog.manage');

        $data = $r->validate([
            'chapter_id' => ['required','integer','exists:chapters,id'],
            'number'     => ['required','integer','between:1,300'],
            'title'      => ['required','string','max:150'],
        ]);

        $row = Subchapter::create($data);

        return response()->json([
            'code' => 'OK',
            'message' => 'Subchapter created',
            'data' => new SubchapterResource($row->load('chapter.book')),
        ], 201);
    }

    public function show(Subchapter $subchapter)
    {
        Gate::authorize('catalog.manage');

        $subchapter->load('chapter.book')->loadCount('contents');

        return response()->json([
            'code' => 'OK',
            'message' => 'Subchapter detail',
            'data' => new SubchapterResource($subchapter),
        ]);
    }

    public function update(SubchapterUpdateRequest $r, Subchapter $subchapter)
    {
        Gate::authorize('catalog.manage');

        $subchapter->update($r->validated());

        return response()->json([
            'code' => 'OK',
            'message' => 'Subchapter updated',
            'data' => new SubchapterResource($subchapter->fresh()->load('chapter.book')),
        ]);
    }

    public function destroy(Subchapter $subchapter)
    {
        Gate::authorize('catalog.manage');

        if ($subchapter->contents()->exists()) {
            return response()->json([
                'code' => 'CONFLICT',
                'message' => 'Subchapter has related contents',
                'data' => null,
            ], 409);
        }

        $subchapter->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Subchapter deleted',
            'data' => null,
        ]);
    }
}
