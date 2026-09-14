<?php

namespace App\Services\Question;

use App\Models\Question\{Question, QuestionOption, QuestionPair, QuestionBlank, QuestionTag};
use App\Models\Curriculum\{Book, Chapter, Subchapter};
use App\Models\Question\QuestionType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class QuestionCsvImporter
{
    public function import(UploadedFile $file, array $opts = []): array
    {
        $delimiter = match($opts['delimiter'] ?? 'comma') {
            'semicolon' => ';', 'tab' => "\t", default => ','
        };

        $encoding  = $opts['encoding'] ?? 'utf8';
        $dryRun    = (bool)($opts['dry_run'] ?? false);
        $chunkSize = 500; // پردازش دسته‌ای

        // خواندن استریم‌محور
        $fh = fopen($file->getRealPath(), 'r');
        if (!$fh) return ['ok'=>false,'message'=>'Cannot open uploaded file'];

        // header
        $header = fgetcsv($fh, 0, $delimiter);
        if (!$header) return ['ok'=>false,'message'=>'CSV header not found'];
        $header = array_map(fn($h)=>trim($h ?? ''), $header);

        // ستون‌های الزامی
        $requiredCols = ['type','difficulty','source','book_page','grade','book','chapter','subchapter','is_free','status','question_text','answer_text','options_json','pairs_json','blanks_json','tags_csv'];
        foreach ($requiredCols as $col) {
            if (!in_array($col, $header)) {
                return ['ok'=>false,'message'=>"Missing column: $col"];
            }
        }

        $rowNum = 1; // بعد از header
        $okCount = 0; $errCount = 0;
        $errors  = [];
        $batch   = [];

        // مپ helper برای سریع‌تر کردن نوع سؤال
        $typeMap = QuestionType::query()->pluck('id','name')->toArray(); // ['Multiple Choice'=>1,...]
        $typeSlugs = QuestionType::query()->pluck('id','slug')->toArray(); // اگر slug داری (اختیاری)

        while (($row = fgetcsv($fh, 0, $delimiter)) !== false) {
            $rowNum++;
            // پر کردن آرایه‌ی associative
            $data = [];
            foreach ($header as $i => $key) {
                $data[$key] = $row[$i] ?? null;
            }

            // نرمال‌سازی
            $data = $this->normalizeRow($data, $encoding);

            // اعتبارسنجی ردیف
            $v = Validator::make($data, [
                'type'         => ['required','string','max:50'],
                'difficulty'   => ['nullable', Rule::in(['easy','medium','hard'])],
                'source'       => ['nullable','string','max:150'],
                'book_page'    => ['nullable','integer'],
                'grade'        => ['nullable','string','max:100'],
                'book'         => ['required','string','max:150'],
                'chapter'      => ['required','string','max:150'],
                'subchapter'   => ['required','string','max:150'],
                'is_free'      => ['required', Rule::in(['0','1',0,1,'true','false'])],
                'status'       => ['required', Rule::in(['draft','published','archived'])],
                'question_text'=> ['required','string'],
                'answer_text'  => ['nullable','string'],
                'options_json' => ['nullable','string'],
                'pairs_json'   => ['nullable','string'],
                'blanks_json'  => ['nullable','string'],
                'tags_csv'     => ['nullable','string'],
            ]);

            if ($v->fails()) {
                $errCount++;
                $errors[] = [
                    'row' => $rowNum,
                    'error' => 'validation',
                    'messages' => $v->errors()->all(),
                ];
                continue;
            }

            $batch[] = $data;

            // هر CHUNK_SIZE ردیف را پردازش/درج کن
            if (count($batch) >= $chunkSize) {
                $res = $this->processBatch($batch, $typeMap, $typeSlugs, $dryRun, $rowNum - count($batch) + 1);
                $okCount += $res['ok'];
                $errCount += $res['err'];
                $errors   = array_merge($errors, $res['errors']);
                $batch = [];
            }
        }
        fclose($fh);

        if (!empty($batch)) {
            $res = $this->processBatch($batch, $typeMap, $typeSlugs, $dryRun, $rowNum - count($batch) + 1);
            $okCount += $res['ok'];
            $errCount += $res['err'];
            $errors   = array_merge($errors, $res['errors']);
        }

        // اگر خطا داریم، CSV گزارش بساز
        $reportUrl = null;
        if ($errCount > 0) {
            $reportUrl = $this->writeErrorReport($errors);
        }

        return [
            'ok'         => true,
            'inserted'   => $okCount,
            'failed'     => $errCount,
            'errors_url' => $reportUrl,
            'dry_run'    => $dryRun,
        ];
    }

    private function normalizeRow(array $data, string $encoding): array
    {
        // تبدیل بولین و trim
        $data['is_free'] = in_array((string)$data['is_free'], ['1','true'], true) ? 1 : 0;
        // اگر لازم است تبدیل اینکدینگ (ساده)
        foreach ($data as $k=>$v) {
            if (is_string($v) && $encoding === 'latin1') {
                $data[$k] = mb_convert_encoding($v, 'UTF-8', 'ISO-8859-1');
            }
        }
        return $data;
    }

    private function processBatch(array $rows, array $typeMap, array $typeSlugs, bool $dryRun, int $firstRowNum): array
    {
        $ok=0; $err=0; $errors=[];
        foreach ($rows as $i=>$row) {
            $rowNo = $firstRowNum + $i;

            DB::beginTransaction();
            try {
                // Resolve نوع سؤال
                $typeId = $this->resolveType($row['type'], $typeMap, $typeSlugs);
                if (!$typeId) throw new \RuntimeException("Unknown question type: {$row['type']}");

                // Resolve شِمای کاتالوگ
                [$bookId, $chapterId, $subId] = $this->resolveCatalog($row['grade'], $row['book'], $row['chapter'], $row['subchapter']);

                // ساخت سؤال
                if (!$dryRun) {
                    $q = Question::create([
                        'type_id'      => $typeId,
                        'subchapter_id'=> $subId,
                        'difficulty'   => $row['difficulty'] ?: null,
                        'source'       => $row['source'] ?: null,
                        'book_page'    => $row['book_page'] ?: null,
                        'question_text'=> $row['question_text'],
                        'answer_text'  => $row['answer_text'] ?: null,
                        'status'       => $row['status'],
                        'is_free'      => (bool)$row['is_free'],
                    ]);

                    // options
                    if (!empty($row['options_json'])) {
                        $opts = json_decode($row['options_json'], true);
                        if (!is_array($opts)) throw new \RuntimeException('Invalid options_json');
                        foreach ($opts as $opt) {
                            QuestionOption::create([
                                'question_id'=> $q->id,
                                'label'      => $opt['label'] ?? null,
                                'text'       => $opt['text'] ?? '',
                                'is_correct' => (bool)($opt['is_correct'] ?? false),
                            ]);
                        }
                    }

                    // pairs
                    if (!empty($row['pairs_json'])) {
                        $pairs = json_decode($row['pairs_json'], true);
                        if (!is_array($pairs)) throw new \RuntimeException('Invalid pairs_json');
                        foreach ($pairs as $p) {
                            QuestionPair::create([
                                'question_id'=> $q->id,
                                'left_text'  => $p['left_text'] ?? '',
                                'right_text' => $p['right_text'] ?? '',
                                'match_key'  => $p['match_key'] ?? null,
                            ]);
                        }
                    }

                    // blanks
                    if (!empty($row['blanks_json'])) {
                        $blanks = json_decode($row['blanks_json'], true);
                        if (!is_array($blanks)) throw new \RuntimeException('Invalid blanks_json');
                        foreach ($blanks as $b) {
                            QuestionBlank::create([
                                'question_id' => $q->id,
                                'blank_index' => (int)($b['blank_index'] ?? 1),
                                'correct_text'=> $b['correct_text'] ?? '',
                            ]);
                        }
                    }

                    // tags
                    if (!empty($row['tags_csv'])) {
                        $tags = collect(explode(',', $row['tags_csv']))
                            ->map(fn($t)=>trim($t))
                            ->filter();
                        if ($tags->count()) {
                            $tagIds = [];
                            foreach ($tags as $tagName) {
                                $tag = QuestionTag::firstOrCreate(
                                    ['slug'=> str($tagName)->slug()->value()],
                                    ['name'=>$tagName]
                                );
                                $tagIds[] = $tag->id;
                            }
                            $q->tags()->sync($tagIds);
                        }
                    }
                }

                DB::commit();
                $ok++;
            } catch (\Throwable $e) {
                DB::rollBack();
                $err++;
                $errors[] = [
                    'row'     => $rowNo,
                    'error'   => 'exception',
                    'message' => $e->getMessage(),
                ];
            }
        }

        return ['ok'=>$ok,'err'=>$err,'errors'=>$errors];
    }

    private function resolveType(string $type, array $byName, array $bySlug): ?int
    {
        // تلاش با اسم دقیق، بعد اسلاگ ساده
        if (isset($byName[$type])) return $byName[$type];
        $slug = str($type)->slug()->value();
        return $bySlug[$slug] ?? null;
    }

    private function resolveCatalog(?string $gradeName, string $bookTitle, string $chapterTitle, string $subTitle): array
    {
        $book = Book::where('title',$bookTitle)->first();
        if (!$book && $gradeName) {
            // در صورت نیاز، بر اساس گرید هم constrain کن
            $book = Book::where('title',$bookTitle)
                ->whereHas('grade', fn($q)=>$q->where('name',$gradeName))
                ->first();
        }
        if (!$book) throw new \RuntimeException("Book not found: $bookTitle");

        $chapter = Chapter::where('book_id',$book->id)->where('title',$chapterTitle)->first();
        if (!$chapter) throw new \RuntimeException("Chapter not found: $chapterTitle");

        $sub = Subchapter::where('chapter_id',$chapter->id)->where('title',$subTitle)->first();
        if (!$sub) throw new \RuntimeException("Subchapter not found: $subTitle");

        return [$book->id, $chapter->id, $sub->id];
    }

    private function writeErrorReport(array $errors): ?string
    {
        $dir = 'imports/reports/'.now()->format('Y/m');
        $name= 'questions-errors-'.time().'.csv';
        $path= "$dir/$name";

        $fh = fopen('php://temp','w+');
        fputcsv($fh, ['row','error','message']);
        foreach ($errors as $e) {
            fputcsv($fh, [$e['row'], $e['error'], $e['message'] ?? '']);
        }
        rewind($fh);
        Storage::disk('public')->put($path, stream_get_contents($fh));
        fclose($fh);

        return Storage::disk('public')->url($path);
    }
}
