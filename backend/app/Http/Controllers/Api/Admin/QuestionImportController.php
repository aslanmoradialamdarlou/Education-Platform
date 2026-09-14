<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuestionImportRequest;
use App\Jobs\ImportQuestionsJob;
use App\Jobs\ProcessQuestionImportChunk;
use App\Models\ImportBatch;
use App\Models\ImportError;
use App\Models\Question\QuestionImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QuestionImportController extends Controller
{
    public function __construct() {
        $this->middleware(['auth:sanctum','role:admin']);
    }

    public function import(QuestionImportRequest $r)
    {
        $file      = $r->file('file');
        $delimiter = $r->input('delimiter', ','); // ',', ';', "\t"
        $chunkSize = (int) $r->input('chunk_size', 200);

        // 1) ذخیره امن روی دیسک local
        $storedPath = $file->storeAs('imports', Str::uuid().'.csv', 'local');
        $fullPath   = Storage::path($storedPath);

        // 2) ساخت رکورد Batch
        $batch = ImportBatch::create([
            'type'         => 'questions',
            'user_id'      => $r->user()->id,
            'source_path'  => $storedPath,
            'original_name'=> $file->getClientOriginalName(),
            'mime_type'    => $file->getClientMimeType(),
            'status'       => 'queued',
            'total_rows'   => 0,
            'rows_processed' => 0,
            'errors_count'   => 0,
            'meta'         => ['delimiter' => $delimiter, 'chunk_size' => $chunkSize],
        ]);

        // 3) خواندن CSV یک‌پاسه و ارسال چانک‌ها به صف
        $handle = @fopen($fullPath, 'r');
        if (!$handle) {
            $batch->update(['status' => 'failed']);
            return response()->json(['code'=>'FILE_OPEN_ERROR','message'=>'Cannot open file'], 422);
        }

        // سربرگ + حذف BOM
        $header = fgetcsv($handle, 0, $delimiter);
        if (!$header) {
            fclose($handle);
            $batch->update(['status' => 'failed']);
            return response()->json(['code'=>'INVALID_HEADER','message'=>'Empty or invalid CSV header'], 422);
        }
        // حذف BOM از ستون اول اگر وجود دارد
        if (isset($header[0])) {
            $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
        }

        // سربرگ لازم (با تمپلیت خودت چک کن)
        $required = ['type','difficulty','source','book_page','grade','book','chapter','subchapter','is_free','status','question_text','answer_text','options_json','pairs_json','blanks_json','tags_csv'];
        $missing = array_diff($required, $header);
        if ($missing) {
            fclose($handle);
            $batch->update(['status' => 'failed']);
            return response()->json([
                'code'=>'INVALID_HEADER',
                'message'=>'Missing header columns: '.implode(', ', $missing)
            ], 422);
        }

        $headerIndex = array_flip($header);

        $buffer   = [];
        $rowNo    = 0;
        $jobs     = [];

        while (($line = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowNo++;
            $assoc = [];
            // map by index
            foreach ($required as $col) {
                $idx = $headerIndex[$col] ?? null;
                $assoc[$col] = $idx !== null ? ($line[$idx] ?? null) : null;
            }
            $buffer[] = $assoc;

            if (count($buffer) >= $chunkSize) {
                $jobs[] = new ProcessQuestionImportChunk($batch->id, $buffer);
                $buffer = [];
            }
        }
        fclose($handle);

        // باقیمانده
        if ($buffer) {
            $jobs[] = new ProcessQuestionImportChunk($batch->id, $buffer);
        }

        // اگر هیچ سطری نبود
        if ($rowNo === 0) {
            $batch->update(['status'=>'failed','total_rows'=>0]);
            return response()->json(['code'=>'EMPTY_FILE','message'=>'CSV has no data rows'], 422);
        }

        // ثبت total_rows و استارت Batch واقعی
        $batch->update(['total_rows' => $rowNo, 'status' => 'processing']);

        // Batch با Bus
        Bus::batch($jobs)
            ->name('Import Questions #'.$batch->id)
            ->onQueue('imports')
            ->allowFailures()  // می‌خوای fail یک چانک کل Batch رو fail نکنه
            ->finally(function () use ($batch) {
                // اگر هنوز processing است، به finished تغییر بده
                if ($batch->status === 'processing') {
                    $batch->update(['status' => 'finished']);
                }
            })
            ->dispatch();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Import queued',
            'data'    => [
                'batch_id'   => $batch->id,
                'total_rows' => $rowNo,
                'chunk_size' => $chunkSize,
            ],
        ], 202);
    }

    public function status(ImportBatch $batch)
    {
        $this->authorize('view', $batch); // اگر Policy خواستی
        return response()->json([
            'code'    => 'OK',
            'message' => 'Import status',
            'data'    => $batch->only([
                'id','status','total_rows','processed_rows','success_rows','failed_rows','errors','created_at','updated_at'
            ]),
        ]);
    }

    private function assocRow(array $header, array $line): array
    {
        $assoc = [];
        foreach ($header as $i => $key) {
            if ($i === 0 && isset($line[0])) {
                $line[0] = preg_replace('/^\xEF\xBB\xBF/', '', $line[0]); // حذف BOM
            }
            $assoc[$key] = $line[$i] ?? null;
        }
        return $assoc;
    }

    public function store(Request $r)
    {
        $r->validate([
            'file' => ['required','file','mimes:csv,txt','max:10240'],
        ]);

        $path = $r->file('file')->store('imports','local'); // storage/app/imports/...

        $import = QuestionImport::create([
            'user_id'   => $r->user()->id,
            'file_path' => $path,
            'status'    => 'queued',
        ]);

        ImportQuestionsJob::dispatch($import->id);

        return response()->json([
            'code' => 'OK',
            'message' => 'Import queued',
            'data' => ['import_id'=>$import->id],
        ], 202);
    }

    public function show(ImportBatch $batch)
    {

        return response()->json([
            'code'    => 'OK',
            'message' => 'Import status',
            'data'    => [
                'id'              => $batch->id,
                'status'          => $batch->status,              // queued|processing|finished|failed
                'total_rows'      => $batch->total_rows,
                'processed_rows'  => $batch->rows_processed,
                'success_count'   => max(0, (int)$batch->rows_processed - (int)$batch->errors_count),
                'error_count'     => (int)$batch->errors_count,
                'meta'            => $batch->meta ?? [],
                'started_at'      => optional($batch->created_at)->toDateTimeString(),
                'finished_at'     => optional($batch->updated_at)->toDateTimeString(),
            ],
        ]);
    }



    public function errors(Request $r, ImportBatch $batch)
    {
        $perPage = (int) $r->integer('per_page', 50);

        $errs = ImportError::where('batch_id', $batch->id)
            ->orderBy('id')
            ->paginate($perPage);

        // 🔁 فال‌بک اختیاری به meta['errors'] برای Batchهای قدیمی
        if ($errs->total() === 0 && !empty($batch->meta['errors']) && is_array($batch->meta['errors'])) {
            $arr  = collect($batch->meta['errors']);
            $page = (int) $r->integer('page', 1);
            $per  = $perPage;

            $slice = $arr->forPage($page, $per)->values()->map(fn($e) => [
                'id'        => null,
                'row_no'    => $e['row'] ?? null,
                'message'   => $e['error'] ?? 'unknown',
                'payload'   => $e['row'] ?? [],
                'created_at'=> null,
            ]);

            return response()->json([
                'code'    => 'OK',
                'message' => 'Import errors (meta fallback)',
                'data'    => [
                    'current_page' => $page,
                    'data'         => $slice,
                    'per_page'     => $per,
                    'total'        => $arr->count(),
                    'last_page'    => (int) ceil($arr->count() / max(1, $per)),
                    'first_page_url' => url()->current().'?page=1',
                    'last_page_url'  => url()->current().'?page='.(int) ceil($arr->count() / max(1,$per)),
                ],
                'meta'    => [
                    'current_page' => $page,
                    'per_page'     => $per,
                    'total'        => $arr->count(),
                ],
            ]);
        }

        // حالت نرمال: از جدول
        return response()->json([
            'code'    => 'OK',
            'message' => 'Import errors',
            'data'    => $errs->through(function(ImportError $e) {
                return [
                    'id'        => $e->id,
                    'row_no'    => $e->row_no,
                    'message'   => $e->message,
                    'payload'   => $e->payload,
                    'created_at'=> optional($e->created_at)->toDateTimeString(),
                ];
            }),
            'meta'    => [
                'current_page' => $errs->currentPage(),
                'per_page'     => $errs->perPage(),
                'total'        => $errs->total(),
            ],
        ]);
    }

}
