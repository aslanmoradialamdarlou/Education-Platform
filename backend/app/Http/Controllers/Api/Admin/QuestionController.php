<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuestionImportRequest;
use App\Http\Requests\Admin\QuestionStoreRequest;
use App\Http\Requests\Admin\QuestionUpdateRequest;
use App\Services\Question\QuestionCsvImporter;
use App\Services\Question\QuestionImportService;
use App\Models\Question\{Question, QuestionType, QuestionOption, QuestionPair, QuestionBlank, QuestionAsset, QuestionTag};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QuestionController extends Controller
{
    public function __construct()
    {
        // Accept both canonical 'admin' and legacy/alternate 'Administrator' role names using the 'api' guard.
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']); // یا permission های ریزتر
    }

    public function index(Request $r)
    {
        // Gate::authorize('catalog.manage');

        $q = Question::query()
            ->with(['type:id,name', 'subchapter:id,chapter_id,title',
                'subchapter.chapter:id,book_id,title',
                'subchapter.chapter.book:id,grade_id,subject_id,title'])
            ->withCount(['options','pairs','blanks','assets']);

        // فیلترها
        if ($search = $r->query('q')) {
            $q->where('question_text','like',"%{$search}%");
        }
        if ($r->filled('type_id')) $q->where('type_id', $r->integer('type_id'));
        if ($r->filled('difficulty')) $q->where('difficulty',$r->query('difficulty'));
        if ($r->filled('is_free')) $q->where('is_free', filter_var($r->query('is_free'), FILTER_VALIDATE_BOOLEAN));
        if ($r->filled('status')) $q->where('status',$r->query('status'));

        // فیلتر سلسله‌ای
        if ($r->filled('subchapter_id')) $q->where('subchapter_id', $r->integer('subchapter_id'));
        if ($r->filled('chapter_id')) {
            $chapterId = $r->integer('chapter_id');
            $q->whereHas('subchapter', fn($qq)=>$qq->where('chapter_id',$chapterId));
        }
        if ($r->filled('book_id')) {
            $bookId = $r->integer('book_id');
            $q->whereHas('subchapter.chapter', fn($qq)=>$qq->where('book_id',$bookId));
        }
        if ($r->filled('grade_id')) {
            $gradeId = $r->integer('grade_id');
            $q->whereHas('subchapter.chapter.book', fn($qq)=>$qq->where('grade_id',$gradeId));
        }

        if ($r->filled('tag_id')) {
            $tagId = $r->integer('tag_id');
            $q->whereHas('tags', fn($qq)=>$qq->where('question_tags.id',$tagId));
        }

        // سورت
        $sort = $r->query('sort','-id'); // -id, id, difficulty, status
        $q = match ($sort) {
            'id'   => $q->orderBy('id'),
            '-id'  => $q->orderByDesc('id'),
            'difficulty' => $q->orderBy('difficulty'),
            'status'     => $q->orderBy('status'),
            default      => $q->orderByDesc('id'),
        };

        $perPage = $r->integer('per_page', $r->integer('per', 20));
        $items = $q->paginate($perPage);

        return response()->json([
            'code'=>'OK','message'=>'Questions list',
            'data'=>$items->through(fn(Question $it)=>$this->serialize($it)),
            'meta'=>[
                'current_page'=>$items->currentPage(),
                'per_page'=>$items->perPage(),
                'total'=>$items->total(),
            ]
        ]);
    }

    public function store(QuestionStoreRequest $req)
    {
        $data = $req->validated();

        $question = Question::create([
            'type_id'       => $data['type_id'],
            'grade_id'      => $data['grade_id'] ?? null,
            'book_id'       => $data['book_id'] ?? null,
            'chapter_id'    => $data['chapter_id'] ?? null,
            'subchapter_id' => $data['subchapter_id'] ?? null,
            'difficulty'    => $data['difficulty'] ?? null,
            'source'        => $data['source'] ?? null,
            'book_page'     => $data['book_page'] ?? null,
            'question_text' => $data['question_text'],
            'answer_text'   => $data['answer_text'] ?? null,
            'status'        => $data['status'] ?? 'draft',
            'is_free'       => (bool)($data['is_free'] ?? false),
            'token_price'   => $data['token_price'] ?? 0,
        ]);

        $this->syncTypeData($question, $data);

        // Optional cover/image URL provided directly
        if (!empty($data['image_url'])) {
            QuestionAsset::create([
                'question_id' => $question->id,
                'type'        => 'image',
                'file_path'   => null,
                'file_url'    => $data['image_url'],
                'meta'        => null,
            ]);
        }

        if (!empty($data['tag_ids'])) {
            $question->tags()->sync($data['tag_ids']);
        }

    $question->load(['type','subchapter.chapter.book','tags']);
    $question->loadCount(['options','pairs','blanks','assets']);

        return response()->json([
            'code'=>'OK','message'=>'Question created',
            'data'=>$this->serialize($question),
        ], 201);
    }

    public function show(Question $question)
    {
        $question->load(['type','subchapter.chapter.book','tags','options','pairs','blanks','assets']);
        $question->loadCount(['options','pairs','blanks','assets']);

        return response()->json([
            'code'=>'OK','message'=>'Question detail',
            'data'=>$this->serialize($question, true),
        ]);
    }

    public function update(QuestionUpdateRequest $req, Question $question)
    {
        $data = $req->validated();

        $question->fill([
            'type_id'       => $data['type_id'] ?? $question->type_id,
            'grade_id'      => array_key_exists('grade_id',$data) ? $data['grade_id'] : $question->grade_id,
            'book_id'       => array_key_exists('book_id',$data) ? $data['book_id'] : $question->book_id,
            'chapter_id'    => array_key_exists('chapter_id',$data) ? $data['chapter_id'] : $question->chapter_id,
            'subchapter_id' => $data['subchapter_id'] ?? $question->subchapter_id,
            'difficulty'    => $data['difficulty'] ?? $question->difficulty,
            'source'        => $data['source'] ?? $question->source,
            'book_page'     => $data['book_page'] ?? $question->book_page,
            'question_text' => $data['question_text'] ?? $question->question_text,
            'answer_text'   => array_key_exists('answer_text',$data) ? $data['answer_text'] : $question->answer_text,
            'status'        => $data['status'] ?? $question->status,
            'is_free'       => array_key_exists('is_free',$data) ? (bool)$data['is_free'] : $question->is_free,
            'token_price'   => array_key_exists('token_price',$data) ? (int)$data['token_price'] : $question->token_price,
        ])->save();

        $this->syncTypeData($question, $data, true);

        // If image_url explicitly provided in payload, update cover asset accordingly
        if (array_key_exists('image_url', $data)) {
            // Remove previous image assets (and their stored files if any)
            $question->assets()->where('type','image')->get()->each(function(QuestionAsset $asset){
                if (!empty($asset->file_path)) {
                    Storage::disk('public')->delete($asset->file_path);
                }
                $asset->delete();
            });

            if (!empty($data['image_url'])) {
                QuestionAsset::create([
                    'question_id' => $question->id,
                    'type'        => 'image',
                    'file_path'   => null,
                    'file_url'    => $data['image_url'],
                    'meta'        => null,
                ]);
            }
        }

        if (array_key_exists('tag_ids', $data)) {
            $question->tags()->sync($data['tag_ids'] ?? []);
        }

        $question->load(['type','subchapter.chapter.book','tags']);
        $question->loadCount(['options','pairs','blanks','assets']);

        return response()->json([
            'code'=>'OK','message'=>'Question updated',
            'data'=>$this->serialize($question),
        ]);
    }

    public function destroy(Question $question)
    {
        // Clean up children first
        $question->options()->delete();
        $question->pairs()->delete();
        $question->blanks()->delete();
        // Delete asset files if stored locally, then delete records
        $question->assets()->get()->each(function(QuestionAsset $asset){
            if (!empty($asset->file_path)) {
                Storage::disk('public')->delete($asset->file_path);
            }
            $asset->delete();
        });
        $question->tags()->detach();

        // Hard delete to ensure row is removed (not soft-deleted lingering)
        $question->forceDelete();

        return response()->json([
            'code'=>'OK','message'=>'Question deleted','data'=>null
        ]);
    }

    public function publish(Question $question)
    {
        $question->update(['status'=>'published']);
        return response()->json(['code'=>'OK','message'=>'Question published','data'=>['id'=>$question->id]]);
    }

    public function archive(Question $question)
    {
        $question->update(['status'=>'archived']);
        return response()->json(['code'=>'OK','message'=>'Question archived','data'=>['id'=>$question->id]]);
    }

    // آپلود فایل (تصویر/پی‌دی‌اف/...)
    public function uploadAsset(Request $r, Question $question)
    {
        $r->validate([
            'file' => ['required','file','max:8192'], // 8MB
            'type' => ['nullable','in:image,pdf,audio,video']
        ]);

        $disk = 'public';
        $path = $r->file('file')->store('questions', $disk);
        $url  = asset('storage/'.$path);

        $asset = QuestionAsset::create([
            'question_id'=>$question->id,
            'type'=>$r->input('type') ?: $this->guessType($r->file('file')->getClientOriginalExtension()),
            'file_path'=>$path,
            'file_url'=>$url,
            'meta'=>null,
        ]);

        return response()->json([
            'code'=>'OK','message'=>'Uploaded','data'=>[
                'id'=>$asset->id,'url'=>$url,'path'=>$path,'type'=>$asset->type
            ]
        ], 201);
    }

    /* ------------- helpers ------------- */

    private function guessType(?string $ext): string
    {
        $ext = strtolower((string)$ext);
        return match(true) {
            in_array($ext,['jpg','jpeg','png','webp','gif']) => 'image',
            $ext === 'pdf'  => 'pdf',
            in_array($ext,['mp3','wav','ogg']) => 'audio',
            in_array($ext,['mp4','webm']) => 'video',
            default => 'file',
        };
    }

    private function syncTypeData(Question $q, array $data, bool $isUpdate=false): void
    {
        $type = $q->type?->name;

        if ($isUpdate) {
            // اگر آرایه‌ی مربوطه ارسال شده باشد، ابتدا پاک و دوباره بساز
            if (array_key_exists('options',$data)) $q->options()->delete();
            if (array_key_exists('pairs',$data))   $q->pairs()->delete();
            if (array_key_exists('blanks',$data))  $q->blanks()->delete();
        }

        if ($type === 'mcq' && !empty($data['options'])) {
            foreach ($data['options'] as $op) {
                $q->options()->create([
                    'label' => $op['label'] ?? null,
                    'text'  => $op['text'],
                    'is_correct' => (bool)$op['is_correct'],
                ]);
            }
        }

        if ($type === 'match' && !empty($data['pairs'])) {
            foreach ($data['pairs'] as $p) {
                $q->pairs()->create([
                    'left_text'  => $p['left_text'],
                    'right_text' => $p['right_text'],
                    'match_key'  => $p['match_key'] ?? null,
                ]);
            }
        }

        if ($type === 'fill_blank' && !empty($data['blanks'])) {
            foreach ($data['blanks'] as $b) {
                $q->blanks()->create([
                    'blank_index'  => (int)$b['blank_index'],
                    'correct_text' => $b['correct_text'],
                ]);
            }
        }
    }

    private function serialize(Question $q, bool $withChildren=false): array
    {
        $base = [
            'id'          => $q->id,
            'type'        => ['id'=>$q->type_id, 'name'=>$q->type?->name],
            'grade_id'    => $q->grade_id,
            'book_id'     => $q->book_id,
            'chapter_id'  => $q->chapter_id,
            'subchapter_id' => $q->subchapter_id,
            'subchapter'  => [
                'id' => $q->subchapter_id,
                'name' => $q->subchapter?->title,
                'number' => $q->subchapter?->number,
                'chapter' => [
                    'id' => $q->subchapter?->chapter_id,
                    'name'=> $q->subchapter?->chapter?->title,
                    'book'=> [
                        'id' => $q->subchapter?->chapter?->book_id,
                        'title' => $q->subchapter?->chapter?->book?->title,
                        'grade_id' => $q->subchapter?->chapter?->book?->grade_id,
                    ]
                ]
            ],
            'difficulty'  => $q->difficulty,
            'source'      => $q->source,
            'book_page'   => $q->book_page,
            'question_text'=> $q->question_text,
            'answer_text' => $q->answer_text,
            'is_free'     => (bool)$q->is_free,
            'token_price' => $q->token_price ?? 0,
            'status'      => $q->status,
            'tags'        => $q->tags?->map(fn($t)=>['id'=>$t->id,'name'=>$t->name])->values() ?? [],
            'counters'    => [
                'options' => $q->options_count ?? $q->options()->count(),
                'pairs'   => $q->pairs_count ?? $q->pairs()->count(),
                'blanks'  => $q->blanks_count ?? $q->blanks()->count(),
                'assets'  => $q->assets_count ?? $q->assets()->count(),
            ],
            'created_at'  => optional($q->created_at)->toDateTimeString(),
            'updated_at'  => optional($q->updated_at)->toDateTimeString(),
        ];

        if ($withChildren) {
            $base['children'] = [
                'options' => $q->options()->get(['id','label','text','is_correct']),
                'pairs'   => $q->pairs()->get(['id','left_text','right_text','match_key']),
                'blanks'  => $q->blanks()->get(['id','blank_index','correct_text']),
                'assets'  => $q->assets()->get(['id','type','file_url','file_path']),
            ];
        }

        return $base;
    }


    public function import(QuestionImportRequest $r, QuestionCsvImporter $importer)
    {
        $res = $importer->import($r->file('file'), [
            'dry_run'  => $r->boolean('dry_run'),
            'delimiter'=> $r->input('delimiter','comma'),
            'encoding' => $r->input('encoding','utf8'),
        ]);

        $status = $res['ok'] ? 200 : 422;
        return response()->json([
            'code'    => $res['ok'] ? 'OK' : 'ERROR',
            'message' => $res['ok'] ? 'Import finished' : ($res['message'] ?? 'Import failed'),
            'data'    => [
                'inserted'   => $res['inserted'] ?? 0,
                'failed'     => $res['failed']  ?? 0,
                'errors_url' => $res['errors_url'] ?? null,
                'dry_run'    => $res['dry_run'] ?? false,
            ],
        ], $status);
    }

    public function downloadTemplate()
    {
        $csv = implode("\n", [
            'type,difficulty,source,book_page,grade,book,chapter,subchapter,is_free,status,question_text,answer_text,options_json,pairs_json,blanks_json,tags_csv',
            'mcq,easy,کتاب درسی,12,هفتم,علوم هفتم,فصل 1,زیر فصل 1,1,published,"سؤال تستی نمونه","توضیح پاسخ","[{""label"":""A"",""text"":""گزینه 1"",""is_correct"":true},{""label"":""B"",""text"":""گزینه 2""}]",,,tag1,tag2'
        ]);

        $dir  = 'imports/templates';
        $name = 'questions-template.csv';
        Storage::disk('public')->put("$dir/$name", $csv);

        return response()->json([
            'code' => 'OK',
            'message' => 'Template ready',
            'data' => ['url' => Storage::url("$dir/$name")],
        ]);
    }




}
// 