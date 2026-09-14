<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SubjectStoreRequest;
use App\Http\Requests\Admin\SubjectUpdateRequest;
use App\Http\Resources\Admin\SubjectResource;
use App\Models\Curriculum\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
     public function __construct()
     {
         $this->middleware('permission:subjects.view')->only(['index','show']);
         $this->middleware('permission:subjects.create')->only(['store']);
         $this->middleware('permission:subjects.update')->only(['update']);
         $this->middleware('permission:subjects.delete')->only(['destroy']);
     }

    public function index(Request $r)
    {
        $q = Subject::query();

        if ($search = $r->query('q')) {
            $q->where('name', 'like', "%{$search}%");
        }

        $q->withCount('books')->orderBy('id');

        // per_page یا per (هر دو را پشتیبانی کنیم)
        $perPage = $r->integer('per_page', $r->integer('per', 20));
        $subjects = $q->paginate($perPage);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Subjects list',
            'data'    => SubjectResource::collection($subjects),
            'meta'    => [
                'current_page' => $subjects->currentPage(),
                'per_page'     => $subjects->perPage(),
                'total'        => $subjects->total(),
            ],
        ]);
    }

    public function store(SubjectStoreRequest $req)
    {
        $subject = Subject::create($req->validated());

        return response()->json([
            'code'    => 'OK',
            'message' => 'Subject created',
            'data'    => new SubjectResource($subject),
        ], 201);
    }

    public function show(Subject $subject)
    {
        $subject->loadCount('books');

        return response()->json([
            'code'    => 'OK',
            'message' => 'Subject detail',
            'data'    => new SubjectResource($subject),
        ]);
    }

    public function update(SubjectUpdateRequest $req, Subject $subject)
    {
        $subject->update($req->validated());

        return response()->json([
            'code'    => 'OK',
            'message' => 'Subject updated',
            'data'    => new SubjectResource($subject),
        ]);
    }

    public function destroy(Subject $subject)
    {
        if ($subject->books()->exists()) {
            return response()->json([
                'code'    => 'CONFLICT',
                'message' => 'Subject has related books',
                'data'    => null,
            ], 409);
        }

        $subject->delete();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Subject deleted',
            'data'    => null,
        ]);
    }
}
