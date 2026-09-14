<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\QuestionBrowseRequest;
use App\Http\Resources\Public\QuestionDetailResource;
use App\Http\Resources\Public\QuestionListResource;
use App\Http\Resources\Public\QuestionPreviewResource;
use App\Models\Question\Question;
use App\Services\Access\SubscriptionAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionBrowseController extends Controller
{
    public function index(QuestionBrowseRequest $r, SubscriptionAccessService $access)
    {
        $params = $r->validated();

        $q = Question::query()
            ->with([
                'type:id,name',
                // چون در QuestionListResource خروجی tag->name می‌دهی، اینجا name را هم لود کن
                'tags:id,slug,name',

                // ← «title» به‌جای «name»
                'subchapter:id,title,chapter_id',
                'subchapter.chapter:id,title,book_id',
                'subchapter.chapter.book:id,title,grade_id',
                'subchapter.chapter.book.grade:id,name',
                
                // Load question details for rendering in cards
                'options:id,question_id,label,text,is_correct',
                'pairs:id,question_id,left_text,right_text,match_key',
                'blanks:id,question_id,blank_index,correct_text',
                'assets:id,question_id,type,file_url',
            ])
            ->published();

        $access->applyQuestionAccessScope($q, $r->user());

        $q->filterParams($params);

        $sort = $params['sort'] ?? 'newest';
        match ($sort) {
            'oldest'          => $q->orderBy('id'),
            'page_asc'        => $q->orderBy('book_page'),
            'page_desc'       => $q->orderByDesc('book_page'),
            'difficulty_asc'  => $q->orderByRaw("FIELD(difficulty,'easy','medium','hard') asc"),
            'difficulty_desc' => $q->orderByRaw("FIELD(difficulty,'easy','medium','hard') desc"),
            default           => $q->orderByDesc('id'),
        };

        $perPage = (int) ($params['per_page'] ?? 20);
        $p = $q->paginate($perPage);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Questions list',
            'data'    => QuestionListResource::collection($p),
            'meta'    => [
                'current_page' => $p->currentPage(),
                'per_page'     => $p->perPage(),
                'total'        => $p->total(),
            ],
        ]);
    }

    public function show(Request $r, int $question, SubscriptionAccessService $access)
    {
        $q = Question::query()
            ->with([
                'type:id,name',
                // اگر در جزئیات فقط slug می‌خواهی، می‌توانی name را حذف کنی؛ فعلاً نگه‌‎داشتم که منعطف باشد
                'tags:id,slug,name',
                'subchapter:id,title,chapter_id',
                'subchapter.chapter:id,title,book_id',
                'subchapter.chapter.book:id,title,grade_id',
                'subchapter.chapter.book.grade:id,name',
                'options:id,question_id,label,text,is_correct',
                'pairs:id,question_id,left_text,right_text,match_key',
                'blanks:id,question_id,blank_index,correct_text',
                'assets:id,question_id,type,file_url,file_path',
            ])
            ->published();

        $access->applyQuestionAccessScope($q, $r->user());

        $item = $q->whereKey($question)->firstOrFail();

        $includeAnswer = $r->boolean('include_answer', false);
        if (! $includeAnswer) {
            // اگر لازم شد می‌توانی پاسخ را از Resource کنترل کنی
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Question detail',
            'data'    => new QuestionDetailResource($item),
        ]);
    }

    public function preview(Request $r, int $question, SubscriptionAccessService $access)
    {
        $q = Question::query()
            ->with([
                'type:id,name',
                'subchapter:id,title,chapter_id',
                'subchapter.chapter:id,title,book_id',
                'subchapter.chapter.book:id,title,grade_id',
            ])
            ->published();

        $access->applyQuestionAccessScope($q, $r->user());

        $item = $q->whereKey($question)->firstOrFail();

        $showAnswer = $r->boolean('show_answer', false);
        if (! $showAnswer) {
            $item->answer_text = null;
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Preview',
            'data'    => new QuestionPreviewResource($item),
        ]);
    }

    /**
     * GET /api/v1/questions/count
     * Return total number of questions in the question bank (all published questions).
     */
    public function count(Request $r)
    {
        // Count all published questions (not question banks, but individual questions)
        $total = (int) Question::query()->where('status', 'published')->count();
        
        return response()->json([
            'code'    => 'OK',
            'message' => 'Questions count',
            'data'    => [ 'total' => $total ],
        ]);
    }
}
