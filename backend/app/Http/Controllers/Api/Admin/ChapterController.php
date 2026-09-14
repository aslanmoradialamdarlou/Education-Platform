<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\Curriculum\Chapter;
use App\Http\Requests\Admin\ChapterUpdateRequest;
use App\Http\Resources\Admin\ChapterResource;

class ChapterController extends Controller
{
    public function index(Request $r)
    {
        Gate::authorize('catalog.manage');

        $q = Chapter::query()
            ->with(['book.subject','book.grade'])
            ->withCount('subchapters')
            ->orderBy('book_id')->orderBy('number');

        if ($r->filled('book_id')) {
            $q->where('book_id', $r->integer('book_id'));
        }
        if ($search = $r->query('q')) {
            $q->where('title','like',"%{$search}%");
        }

        $rows = $q->paginate($r->integer('per', 20));

        return response()->json([
            'code' => 'OK',
            'message' => 'Chapters list',
            'data' => ChapterResource::collection($rows),
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
            'book_id' => ['required','integer','exists:books,id'],
            'number'  => ['required','integer','between:1,200'],
            'title'   => ['required','string','max:150'],
        ]);

        // یکتا بودن (book_id, number) بر عهده مایگریشن هم هست
        $chapter = Chapter::create($data);

        return response()->json([
            'code' => 'OK',
            'message' => 'Chapter created',
            'data' => new ChapterResource($chapter->load(['book.subject','book.grade'])),
        ], 201);
    }

    public function show(Chapter $chapter)
    {
        Gate::authorize('catalog.manage');

        $chapter->load(['book.subject','book.grade'])->loadCount('subchapters');

        return response()->json([
            'code' => 'OK',
            'message' => 'Chapter detail',
            'data' => new ChapterResource($chapter),
        ]);
    }

    public function update(ChapterUpdateRequest $r, Chapter $chapter)
    {
        Gate::authorize('catalog.manage');

        $chapter->update($r->validated());

        return response()->json([
            'code' => 'OK',
            'message' => 'Chapter updated',
            'data' => new ChapterResource($chapter->fresh()->load(['book.subject','book.grade'])),
        ]);
    }

    public function destroy(Chapter $chapter)
    {
        Gate::authorize('catalog.manage');

        if ($chapter->subchapters()->exists()) {
            return response()->json([
                'code' => 'CONFLICT',
                'message' => 'Chapter has related subchapters',
                'data' => null,
            ], 409);
        }

        $chapter->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Chapter deleted',
            'data' => null,
        ]);
    }
}
