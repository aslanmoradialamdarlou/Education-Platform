<?php

namespace App\Services\Import;

use App\Models\Question\{Question, QuestionType, QuestionTag};
use App\Models\Curriculum\{Book, Chapter, Subchapter, Grade};
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class QuestionRowImporter {
    /**
     * @param array $row  سطر تمپلیت: type,difficulty,source,book_page,grade,book,chapter,subchapter,is_free,status,question_text,answer_text,options_json,pairs_json,blanks_json,tags_csv
     * @return array [ok=>bool, error=>string|null, id=>int|null]
     */
    public function import(array $row): array {
        try {
            return DB::transaction(function () use ($row) {
                // 1) lookup/validate
                $typeName = trim((string)($row['type'] ?? ''));
                $type = QuestionType::where('name', $typeName)->first();
                if (! $type) return ['ok'=>false,'error'=>"Invalid type: {$typeName}",'id'=>null];

                $gradeName = trim((string)($row['grade'] ?? ''));
                $bookTitle = trim((string)($row['book'] ?? ''));
                $chapterTitle = trim((string)($row['chapter'] ?? ''));
                $subTitle = trim((string)($row['subchapter'] ?? ''));

                $grade = $gradeName ? Grade::where('name',$gradeName)->first() : null;
                $book  = $bookTitle ? Book::where('title',$bookTitle)->first() : null;
                $chapter = $chapterTitle ? Chapter::where('title',$chapterTitle)->first() : null;
                $sub = $subTitle ? Subchapter::where('title',$subTitle)->first() : null;

                if (! $sub) return ['ok'=>false,'error'=>"Subchapter not found: {$subTitle}",'id'=>null];

                // 2) main question
                $q = Question::create([
                    'type_id'       => $type->id,
                    'subchapter_id' => $sub->id,
                    'difficulty'    => $row['difficulty'] ?? null,
                    'source'        => $row['source'] ?? null,
                    'book_page'     => !empty($row['book_page']) ? (int)$row['book_page'] : null,
                    'question_text' => (string)$row['question_text'],
                    'answer_text'   => $row['answer_text'] ?? null,
                    'is_free'       => (bool)($row['is_free'] ?? false),
                    'status'        => in_array(($row['status'] ?? 'draft'), ['draft','published','archived']) ? $row['status'] : 'draft',
                ]);

                // 3) options / pairs / blanks
                if (!empty($row['options_json'])) {
                    $opts = json_decode($row['options_json'], true) ?: [];
                    foreach ($opts as $o) {
                        $q->options()->create([
                            'label' => $o['label'] ?? null,
                            'text'  => $o['text'] ?? '',
                            'is_correct' => (bool)($o['is_correct'] ?? false),
                        ]);
                    }
                }
                if (!empty($row['pairs_json'])) {
                    $pairs = json_decode($row['pairs_json'], true) ?: [];
                    foreach ($pairs as $p) {
                        $q->pairs()->create([
                            'left_text'  => $p['left'] ?? '',
                            'right_text' => $p['right'] ?? '',
                            'match_key'  => $p['key'] ?? null,
                        ]);
                    }
                }
                if (!empty($row['blanks_json'])) {
                    $blanks = json_decode($row['blanks_json'], true) ?: [];
                    foreach ($blanks as $b) {
                        $q->blanks()->create([
                            'blank_index' => (int)($b['index'] ?? 0),
                            'correct_text'=> (string)($b['text'] ?? ''),
                        ]);
                    }
                }

                // 4) tags
                if (!empty($row['tags_csv'])) {
                    $tags = array_filter(array_map('trim', explode(',', $row['tags_csv'])));
                    $tagIds = [];
                    foreach ($tags as $tagName) {
                        $tag = QuestionTag::firstOrCreate(
                            ['slug' => Str::slug($tagName)],
                            ['name' => $tagName]
                        );
                        $tagIds[] = $tag->id;
                    }
                    if ($tagIds) $q->tags()->sync($tagIds);
                }

                return ['ok'=>true,'error'=>null,'id'=>$q->id];
            });
        } catch (\Throwable $e) {
            return ['ok'=>false,'error'=>$e->getMessage(),'id'=>null];
        }
    }
}
