<?php

namespace App\Services\Import;

use App\Models\ImportBatch;
use App\Models\Question\Question;
use App\Models\Question\QuestionOption;
use App\Models\Question\QuestionPair;
use App\Models\Question\QuestionBlank;
use App\Models\Question\QuestionTag;
use App\Models\Curriculum\{Grade, Book, Chapter, Subchapter};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class QuestionChunkImporter
{
    /**
     * هر چانک از سطرها را وارد می‌کند و شمارنده‌های ImportBatch را آپدیت می‌کند.
     *
     * @param int   $batchId  شناسه رکورد import_batches
     * @param array $rows     آرایه‌ای از سطرهای map شده با کلیدهای CSV
     */
    public function import(int $batchId, array $rows): void
    {
        $batch = ImportBatch::find($batchId);
        if (! $batch) return;

        $okCount = 0;
        $errCount = 0;

        foreach ($rows as $row) {
            try {
                DB::transaction(function () use ($row) {

                    // 1) Resolve مراجع (grade/book/chapter/subchapter) — اینجا ساده با نام/عنوان‌ها
                    $grade  = Grade::where('name', $row['grade'] ?? null)->first();
                    $book   = $grade
                        ? Book::where('grade_id', $grade->id)->where('title', $row['book'] ?? null)->first()
                        : null;
                    $chapter = $book
                        ? Chapter::where('book_id', $book->id)->where('title', $row['chapter'] ?? null)->first()
                        : null;
                    $subchapter = $chapter
                        ? Subchapter::where('chapter_id', $chapter->id)->where('title', $row['subchapter'] ?? null)->first()
                        : null;

                    // اگر subchapter پیدا نشد، می‌تونی throw کنی تا به خطا بره
                    if (! $subchapter) {
                        throw new \RuntimeException('Subchapter not found: ' . ($row['subchapter'] ?? ''));
                    }

                    // 2) type/difficulty
                    $typeName = strtolower(trim($row['type'] ?? 'mcq'));
                    $typeId   = $this->mapTypeToId($typeName); // پیاده‌سازی سادهٔ نگاشت type_name → question_types.id

                    $difficulty = $this->normalizeDifficulty($row['difficulty'] ?? null);

                    // 3) ساخت Question
                    $q = Question::create([
                        'type_id'       => $typeId,
                        'subchapter_id' => $subchapter->id,
                        'difficulty'    => $difficulty,
                        'source'        => $row['source'] ?: null,
                        'book_page'     => $row['book_page'] ? (int)$row['book_page'] : null,
                        'question_text' => $row['question_text'] ?? '',
                        'answer_text'   => $row['answer_text'] ?? null,
                        'status'        => $this->normalizeStatus($row['status'] ?? 'draft'),
                        'is_free'       => (int) filter_var($row['is_free'] ?? 0, FILTER_VALIDATE_BOOLEAN),
                    ]);

                    // 4) گزینه‌ها (برای MCQ)
                    if (!empty($row['options_json'])) {
                        $options = json_decode($row['options_json'], true) ?: [];
                        foreach ($options as $op) {
                            QuestionOption::create([
                                'question_id' => $q->id,
                                'label'       => $op['label'] ?? null,
                                'text'        => $op['text'] ?? '',
                                'is_correct'  => (bool)($op['is_correct'] ?? false),
                            ]);
                        }
                    }

                    // 5) زوج‌ها (match)
                    if (!empty($row['pairs_json'])) {
                        $pairs = json_decode($row['pairs_json'], true) ?: [];
                        foreach ($pairs as $p) {
                            QuestionPair::create([
                                'question_id' => $q->id,
                                'left_text'   => $p['left'] ?? '',
                                'right_text'  => $p['right'] ?? '',
                                'match_key'   => $p['key'] ?? null,
                            ]);
                        }
                    }

                    // 6) جای‌خالی‌ها
                    if (!empty($row['blanks_json'])) {
                        $blanks = json_decode($row['blanks_json'], true) ?: [];
                        foreach ($blanks as $i => $b) {
                            QuestionBlank::create([
                                'question_id'  => $q->id,
                                'blank_index'  => (int)($b['index'] ?? ($i+1)),
                                'correct_text' => $b['text'] ?? '',
                            ]);
                        }
                    }

                    // 7) تگ‌ها
                    if (!empty($row['tags_csv'])) {
                        $tags = array_filter(array_map('trim', explode(',', $row['tags_csv'])));
                        $tagIds = [];
                        foreach ($tags as $name) {
                            $slug = Str::slug($name);
                            $tag  = QuestionTag::firstOrCreate(['slug'=>$slug], ['name'=>$name]);
                            $tagIds[] = $tag->id;
                        }
                        if ($tagIds) {
                            $q->tags()->sync($tagIds);
                        }
                    }
                });

                $okCount++;

            } catch (Throwable $e) {
                $errCount++;
                // ذخیره خطای این ردیف (اگر خواستی، در meta.errors[] بگذار)
                $this->pushError($batch, $row, $e->getMessage());
            }
        }

        // آپدیت شمارنده‌ها
        $batch->increment('rows_processed', $okCount + $errCount);
        $batch->increment('errors_count', $errCount);
        $batch->refresh();

        // اگر همهٔ سطرها پردازش شدند و وضعیت هنوز processing است، finished کن
        if ($batch->rows_processed >= $batch->total_rows && $batch->status === 'processing') {
            $batch->update(['status' => 'finished']);
        }
    }

    private function pushError(ImportBatch $batch, array $row, string $message): void
    {
        $meta = $batch->meta ?? [];
        $meta['errors'][] = [
            'row' => $row,
            'error' => $message,
        ];
        $batch->meta = $meta;
        $batch->save();
    }

    private function mapTypeToId(string $name): int
    {
        // نگاشت ساده؛ می‌تونی از جدول question_types بخونی
        $map = [
            'mcq'          => 1,
            'multiple'     => 1,
            'multiple choice' => 1,
            'descriptive'  => 2,
            'short_answer' => 3,
            'fill_blank'   => 4,
            'match'        => 5,
        ];
        return $map[$name] ?? 1;
    }

    private function normalizeDifficulty(?string $val): ?string
    {
        if (!$val) return null;
        $v = strtolower(trim($val));
        return in_array($v, ['easy','medium','hard']) ? $v : null;
    }

    private function normalizeStatus(string $val): string
    {
        $v = strtolower(trim($val));
        return in_array($v, ['draft','published','archived']) ? $v : 'draft';
    }
}
