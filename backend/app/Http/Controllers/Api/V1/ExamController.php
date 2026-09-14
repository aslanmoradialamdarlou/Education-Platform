<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\{ExamLayoutUpdateRequest, ExamStoreRequest, ExamUpdateRequest, ExamReorderRequest};
use App\Http\Resources\Exam\ExamResource;
use App\Models\Exam\{Exam, ExamQuestion, ExamExport};
use App\Models\HeaderTemplate; // ✅ مسیر درست
use App\Models\Question\Question;
use App\Services\Access\SubscriptionAccessService;
use App\Services\Exam\ExamPdfService; // ✅ سرویس PDF
use App\Services\Tokens\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum']);
    }

    public function index(Request $r)
    {
        $exams = Exam::where('user_id', $r->user()->id)
            ->withCount('items')
            ->orderByDesc('id')
            ->paginate($r->integer('per_page', 20));

        return response()->json([
            'code' => 'OK',
            'message' => 'My exams',
            'data' => $exams->through(fn(Exam $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'items_count' => $e->items_count,
                'created_at' => optional($e->created_at)->toDateTimeString(),
            ]),
            'meta' => [
                'current_page' => $exams->currentPage(),
                'per_page'     => $exams->perPage(),
                'total'        => $exams->total(),
            ]
        ]);
    }

    public function store(ExamStoreRequest $req)
    {
        $exam = Exam::create([
            'user_id'            => $req->user()->id,
            'title'              => $req->title,
            'header_template_id' => $req->header_template_id,
            // اگر layout توی StoreRequest هم بیاد:
            'layout'             => $req->input('layout', [
                'paper_size'  => 'a4',
                'orientation' => 'portrait',
                'font_family' => 'vazirmatn',
                'font_size'   => 12,
                'numbering'   => '1.',
            ]),
        ]);

        $exam->load(['items','headerTemplate']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Exam created',
            'data' => new ExamResource($exam),
        ], 201);
    }

    public function show(Request $r, Exam $exam)
    {
        abort_if($exam->user_id !== $r->user()->id, 403);

        $exam->load(['items.question.type','headerTemplate','exports']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Exam detail',
            'data' => new ExamResource($exam),
        ]);
    }

    public function update(ExamUpdateRequest $req, Exam $exam)
    {
        // بهتر: داخل ExamUpdateRequest::authorize مالکیت را چک کن
        $exam->update($req->validated());

        $exam->load(['items.question.type','headerTemplate','exports']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Exam updated',
            'data' => new ExamResource($exam),
        ]);
    }

    public function destroy(Request $r, Exam $exam)
    {
        abort_if($exam->user_id !== $r->user()->id, 403);
        $exam->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Exam deleted',
            'data' => null,
        ]);
    }

    // ✅ افزودن سؤال (با مدل pivot)
    public function addQuestion(
        Request $r,
        Exam $exam,
        SubscriptionAccessService $access
    ) {
        abort_if($exam->user_id !== $r->user()->id, 403);

        $data = $r->validate([
            'question_id' => ['required','integer','exists:questions,id'],
            'points'      => ['nullable','numeric','between:0,100'],
        ]);

        $question = Question::query()->published()->findOrFail($data['question_id']);

        if (! $access->userCanAccessQuestion($r->user(), $question)) {
            return response()->json([
                'code' => 'FORBIDDEN',
                'message' => 'You do not have access to this question with your current plan.',
                'data' => null,
            ], 403);
        }

        // جلوگیری از تکرار
        $exists = $exam->items()->where('question_id', $question->id)->exists();
        if ($exists) {
            return response()->json(['code'=>'DUP','message'=>'Question already added','data'=>null], 409);
        }

        $order = (int) ($exam->items()->max('order_number') ?? 0) + 1;

        $exam->items()->create([
            'question_id'  => $question->id,
            'order_number' => $order,
            'points'       => $data['points'] ?? null,
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Question added to exam',
            'data' => [
                'exam_id' => $exam->id,
                'question_id' => $question->id,
                'order' => $order,
            ],
        ], 201);
    }

    public function removeQuestion(Request $r, Exam $exam, ExamQuestion $item)
    {
        abort_if($exam->user_id !== $r->user()->id || $item->exam_id !== $exam->id, 403);
        $item->delete();

        // بازشماری ساده‌ی ترتیب
        $i = 1;
        foreach ($exam->items()->orderBy('order_number')->get() as $row) {
            $row->update(['order_number' => $i++]);
        }

        $exam->load(['items.question.type','headerTemplate']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Question removed',
            'data' => new ExamResource($exam),
        ]);
    }

    public function reorder(ExamReorderRequest $req, Exam $exam)
    {
        abort_if($exam->user_id !== $req->user()->id, 403);

        DB::transaction(function() use ($req, $exam) {
            foreach ($req->items as $it) {
                ExamQuestion::where('id',$it['id'])
                    ->where('exam_id',$exam->id)
                    ->update([
                        'order_number' => $it['order'],
                        'points'       => $it['points'] ?? null,
                    ]);
            }
        });

        $exam->load(['items.question.type']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Reordered',
            'data' => new ExamResource($exam),
        ]);
    }

    public function exportPdf(Request $r, Exam $exam, TokenService $tokens, ExamPdfService $pdfSvc)
    {
        abort_if($exam->user_id !== $r->user()->id, 403);

        // مصرف توکن (اگر سرویس آماده است)
        $res = $tokens->consumeForExport($r->user(), $exam, tokensPerQuestion: 1);
        if (! $res['ok']) {
            return response()->json([
                'code' => 'INSUFFICIENT_TOKENS',
                'message' => "Not enough tokens. Need {$res['needed']}, remain {$res['remain']}.",
                'data' => null,
            ], 402);
        }

        $withAnswers = filter_var($r->query('with_answers', false), FILTER_VALIDATE_BOOLEAN);
        $out = $pdfSvc->render($exam, ['with_answers' => $withAnswers]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Exported',
            'data' => ['url' => $out['url'], 'export_id' => $out['export_id']],
        ]);
    }

    public function exportAnswerKey(Request $r, Exam $exam, ExamPdfService $pdfSvc)
    {
        abort_if($exam->user_id !== $r->user()->id, 403);

        $out = $pdfSvc->render($exam, [
            'mode'          => 'answer_key',   // ← تفاوت با برگه سوال
            'with_answers'  => true,           // کلید پاسخ
        ]);

        return response()->json([
            'code' => 'OK',
            'message' => 'Answer key exported',
            'data' => ['url' => $out['url'], 'export_id' => $out['export_id']],
        ]);
    }

    public function questions(Request $r, Exam $exam)
    {
        abort_if($exam->user_id !== $r->user()->id, 403);

        $rows = $exam->items()
            ->with('question.type')
            ->orderBy('order_number')
            ->get()
            ->map(function($it){
                return [
                    'item_id'      => $it->id,
                    'order'        => $it->order_number,
                    'points'       => $it->points,
                    'question_id'  => $it->question_id,
                    'type'         => $it->question?->type?->name,
                    'question_txt' => $it->question?->question_text,
                ];
            });

        return response()->json([
            'code'    => 'OK',
            'message' => 'Exam questions',
            'data'    => $rows,
        ]);
    }

    public function addQuestions(
        Request $r,
        Exam $exam,
        \App\Services\Access\SubscriptionAccessService $access
    ) {
        abort_if($exam->user_id !== $r->user()->id, 403);

        $data = $r->validate([
            'items' => ['required','array','min:1'],
            'items.*.question_id' => ['required','integer','exists:questions,id'],
            'items.*.points'      => ['nullable','numeric','between:0,100'],
        ]);

        $user = $r->user();
        $added = [];
        $skipped = [];

        $order = (int) ($exam->items()->max('order_number') ?? 0);

        foreach ($data['items'] as $row) {
            $q = \App\Models\Question\Question::query()->published()->find($row['question_id']);
            if (! $q) {
                $skipped[] = ['question_id'=>$row['question_id'], 'reason'=>'not_found_or_unpublished'];
                continue;
            }

            if (! $access->userCanAccessQuestion($user, $q)) {
                $skipped[] = ['question_id'=>$q->id, 'reason'=>'forbidden_by_plan'];
                continue;
            }

            $exists = $exam->items()->where('question_id', $q->id)->exists();
            if ($exists) {
                $skipped[] = ['question_id'=>$q->id, 'reason'=>'duplicate'];
                continue;
            }

            $order++;
            $exam->items()->create([
                'question_id'  => $q->id,
                'order_number' => $order,
                'points'       => $row['points'] ?? null,
            ]);

            $added[] = ['question_id'=>$q->id, 'order'=>$order];
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Bulk add finished',
            'data'    => compact('added','skipped'),
        ], empty($added) ? 200 : 201);
    }

    public function updateLayout(ExamLayoutUpdateRequest $req, Exam $exam)
    {
        $layout = $exam->getMergedLayout();
        $updates = $req->validated();

        // اگر header_template_id بیاد، روی خود exam ست کن (تا در PDF استفاده بشه)
        if (array_key_exists('header_template_id', $updates)) {
            $exam->header_template_id = $updates['header_template_id'];
            unset($updates['header_template_id']);
        }

        $exam->layout = array_replace_recursive($layout, $updates);
        $exam->save();

        $exam->load(['items','headerTemplate']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Layout updated',
            'data' => [
                'layout' => $exam->getMergedLayout(),
                'header_template' => $exam->headerTemplate?->only(['id','name']),
            ],
        ]);
    }


}
