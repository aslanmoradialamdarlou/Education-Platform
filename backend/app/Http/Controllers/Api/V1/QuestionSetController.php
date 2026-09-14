<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Question\QuestionSet;
use App\Models\Question\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuestionSetController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Get all question sets for the authenticated user
     */
    public function index(Request $request)
    {
        $sets = QuestionSet::where('user_id', $request->user()->id)
            ->withCount('questions')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($set) {
                return [
                    'id' => $set->id,
                    'name' => $set->name,
                    'description' => $set->description,
                    'questions_count' => $set->questions_count,
                    'created_at' => $set->created_at->toIso8601String(),
                    'updated_at' => $set->updated_at->toIso8601String(),
                ];
            });

        return response()->json([
            'code' => 'OK',
            'message' => 'Question sets retrieved',
            'data' => $sets,
        ]);
    }

    /**
     * Create a new question set
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $set = QuestionSet::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Question set created',
            'data' => [
                'id' => $set->id,
                'name' => $set->name,
                'description' => $set->description,
                'questions_count' => 0,
                'created_at' => $set->created_at->toIso8601String(),
                'updated_at' => $set->updated_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Get a specific question set with its questions
     */
    public function show(Request $request, $id)
    {
        $set = QuestionSet::where('user_id', $request->user()->id)
            ->with(['questions' => function ($query) {
                $query->with([
                    'type:id,name',
                    'tags:id,slug,name',
                    'subchapter:id,title,chapter_id',
                    'subchapter.chapter:id,title,book_id',
                    'subchapter.chapter.book:id,title,grade_id',
                    'subchapter.chapter.book.grade:id,name',
                ]);
            }])
            ->findOrFail($id);

        $questions = $set->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'difficulty' => $q->difficulty,
                'type' => $q->type?->name,
                'grade' => $q->subchapter?->chapter?->book?->grade?->name,
                'subject' => $q->subchapter?->chapter?->book?->title,
                'chapter' => $q->subchapter?->chapter?->title,
                'subchapter' => $q->subchapter?->title,
                'tags' => $q->tags->pluck('name'),
                'order' => $q->pivot->order,
                'added_at' => $q->pivot->created_at,
            ];
        });

        return response()->json([
            'code' => 'OK',
            'message' => 'Question set details',
            'data' => [
                'id' => $set->id,
                'name' => $set->name,
                'description' => $set->description,
                'questions_count' => $set->questions->count(),
                'questions' => $questions,
                'created_at' => $set->created_at->toIso8601String(),
                'updated_at' => $set->updated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update a question set
     */
    public function update(Request $request, $id)
    {
        $set = QuestionSet::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $set->update($validated);

        return response()->json([
            'code' => 'OK',
            'message' => 'Question set updated',
            'data' => [
                'id' => $set->id,
                'name' => $set->name,
                'description' => $set->description,
                'created_at' => $set->created_at->toIso8601String(),
                'updated_at' => $set->updated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Delete a question set
     */
    public function destroy(Request $request, $id)
    {
        $set = QuestionSet::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $set->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Question set deleted',
            'data' => null,
        ]);
    }

    /**
     * Add a question to a set
     */
    public function addQuestion(Request $request, $id)
    {
        $set = QuestionSet::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'question_id' => ['required', 'integer', 'exists:questions,id'],
        ]);

        $questionId = $validated['question_id'];

        // Check if question already exists in this set
        if ($set->questions()->where('question_id', $questionId)->exists()) {
            return response()->json([
                'code' => 'ALREADY_EXISTS',
                'message' => 'این سوال قبلاً به این مجموعه اضافه شده است',
                'data' => null,
            ], 409);
        }

        // Get the next order number
        $maxOrder = $set->questions()->max('order') ?? 0;

        // Add question to set
        $set->questions()->attach($questionId, [
            'order' => $maxOrder + 1,
            'created_at' => now(),
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'سوال به مجموعه اضافه شد',
            'data' => [
                'question_id' => $questionId,
                'set_id' => $set->id,
            ],
        ], 201);
    }

    /**
     * Remove a question from a set
     */
    public function removeQuestion(Request $request, $setId, $questionId)
    {
        $set = QuestionSet::where('user_id', $request->user()->id)
            ->findOrFail($setId);

        $set->questions()->detach($questionId);

        return response()->json([
            'code' => 'OK',
            'message' => 'سوال از مجموعه حذف شد',
            'data' => null,
        ]);
    }

    /**
     * Reorder questions in a set
     */
    public function reorderQuestions(Request $request, $id)
    {
        $set = QuestionSet::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'question_ids' => ['required', 'array'],
            'question_ids.*' => ['required', 'integer', 'exists:questions,id'],
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['question_ids'] as $order => $questionId) {
                DB::table('question_set_items')
                    ->where('question_set_id', $set->id)
                    ->where('question_id', $questionId)
                    ->update(['order' => $order + 1]);
            }
            DB::commit();

            return response()->json([
                'code' => 'OK',
                'message' => 'ترتیب سوالات به‌روزرسانی شد',
                'data' => null,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
