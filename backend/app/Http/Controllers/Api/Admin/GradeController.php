<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GradeStoreRequest;
use App\Http\Requests\Admin\GradeUpdateRequest;
use App\Http\Resources\Admin\GradeResource;
use App\Models\Curriculum\Grade;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function index(Request $r)
    {
        $q = Grade::query();

        if ($search = trim($r->query('q', ''))) {
            $q->where('name', 'like', "%{$search}%");
        }

        $q->withCount('books')->orderBy('id');

        $perPage = (int) $r->query('per_page', 20);
        $grades  = $q->paginate($perPage)->appends($r->query());

        return response()->json([
            'code'    => 'OK',
            'message' => 'Grades list',
            'data'    => GradeResource::collection($grades),
            'meta'    => [
                'current_page' => $grades->currentPage(),
                'per_page'     => $grades->perPage(),
                'total'        => $grades->total(),
                'last_page'    => $grades->lastPage(),
            ],
        ]);
    }

    public function store(GradeStoreRequest $req)
    {
        $grade = Grade::create($req->validated());

        return response()->json([
            'code'    => 'OK',
            'message' => 'Grade created',
            'data'    => new GradeResource($grade),
        ], 201);
    }

    public function show(Grade $grade)
    {
        $grade->loadCount('books');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Grade detail',
            'data'    => new GradeResource($grade),
        ]);
    }

    public function update(GradeUpdateRequest $req, Grade $grade)
    {
        $grade->update($req->validated());

        return response()->json([
            'code'    => 'OK',
            'message' => 'Grade updated',
            'data'    => new GradeResource($grade),
        ]);
    }

    public function destroy(Grade $grade)
    {
        if ($grade->books()->exists()) {
            return response()->json([
                'code'    => 'CONFLICT',
                'message' => 'Grade has related books',
                'data'    => null,
            ], 409);
        }

        $grade->delete();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Grade deleted',
            'data'    => null,
        ]);
    }
}
