<?php

namespace App\Services\Question;

use App\Models\Question\{Question, QuestionType, QuestionOption, QuestionPair, QuestionBlank, QuestionTag};
use App\Models\Curriculum\{Subchapter, Chapter, Book, Grade};
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class QuestionImportService
{
    /**
     * ساختار CSV (ستون‌ها):
     * type, difficulty, source, book_page, grade, book, chapter, subchapter,
     * is_free, status, question_text, answer_text,
     * options_json, pairs_json, blanks_json,
     * tags_csv
     *
     * - type: mcq|descriptive|short_answer|fill_blank|match
     * - options_json: [{"label":"A","text":"...","is_correct":true}, ...]
     * - pairs_json:   [{"left":"...","right":"...","key":"K1"}, ...]
     * - blanks_json:  [{"index":1,"text":"جواب"}, ...]
     * - tags_csv:     slug1,slug2,slug3  (یا اسامی؛ ما اسلاگ‌سازی می‌کنیم)
     */
    public function importCsv(string $filepath, array $opts = []): array
    {
        $defaults = [
            'on_conflict'     => 'skip',      // skip|update|duplicate
            'default_is_free' => true,
            'default_status'  => 'draft',
            'author_id'       => null,
        ];
        $o = array_merge($defaults, $opts);

        if (!is_readable($filepath)) {
            throw new RuntimeException('CSV file is not readable.');
        }

        $fh = fopen($filepath, 'r');
        if (!$fh) throw new RuntimeException('Failed to open CSV file.');

        // Header
        $header = fgetcsv($fh);
        if (!$header) throw new RuntimeException('Empty CSV.');

        $map = $this->normalizeHeader($header);

        $created = 0; $updated = 0; $skipped = 0; $errors = [];

        while (($row = fgetcsv($fh)) !== false) {
            $data = $this->rowToAssoc($map, $row);
            try {
                DB::transaction(function() use ($data, $o, &$created, &$updated, &$skipped) {
                    $this->upsertOne($data, $o, $created, $updated, $skipped);
                });
            } catch (\Throwable $e) {
                $errors[] = [
                    'row' => $data,
                    'error' => $e->getMessage(),
                ];
            }
        }

        fclose($fh);

        return compact('created','updated','skipped','errors');
    }

    private function normalizeHeader(array $header): array
    {
        return array_map(function($h) {
            return Str::slug(trim(mb_strtolower($h)), '_');
        }, $header);
    }

    private function rowToAssoc(array $map, array $row): array
    {
        $assoc = [];
        foreach ($map as $i => $key) {
            $assoc[$key] = $row[$i] ?? null;
        }
        return $assoc;
    }

    private function upsertOne(array $r, array $o, int &$created, int &$updated, int &$skipped): void
    {
        // Resolve hierarchy: grade/book/chapter/subchapter (حداقل subchapter لازم است)
        $subchapter = $this->resolveSubchapter($r);
        if (!$subchapter) {
            throw new RuntimeException('Subchapter not found (need grade/book/chapter/subchapter).');
        }

        // Resolve type
        $typeName = trim((string)($r['type'] ?? ''));
        if (!$typeName) throw new RuntimeException('type is required');
        $type = QuestionType::where('name', $typeName)->first();
        if (!$type) throw new RuntimeException("Unknown type: {$typeName}");

        // Base fields
        $base = [
            'type_id'       => $type->id,
            'subchapter_id' => $subchapter->id,
            'difficulty'    => $this->safeEnum($r['difficulty'] ?? null, ['easy','medium','hard']),
            'source'        => $this->nullIfEmpty($r['source'] ?? null),
            'book_page'     => $this->intOrNull($r['book_page'] ?? null),
            'question_text' => (string)($r['question_text'] ?? ''),
            'answer_text'   => $this->nullIfEmpty($r['answer_text'] ?? null),
            'is_free'       => $this->toBool($r['is_free'] ?? null, $o['default_is_free']),
            'status'        => $this->safeEnum($r['status'] ?? $o['default_status'], ['draft','published','archived']),
        ];
        if (!$base['question_text']) throw new RuntimeException('question_text is required');

        // Uniqueness key: می‌تونی تغییر بدی (مثلاً متن+زیر‌فصل)
        $uniqueWhere = [
            'subchapter_id' => $base['subchapter_id'],
            'question_text' => $base['question_text'],
        ];

        /** @var Question|null $existing */
        $existing = Question::where($uniqueWhere)->first();

        if ($existing) {
            if ($o['on_conflict'] === 'skip') {
                $skipped++; return;
            } elseif ($o['on_conflict'] === 'update') {
                $existing->fill($base)->save();
                $this->syncByType($existing, $r);            // options/pairs/blanks
                $this->syncTags($existing, $r['tags_csv'] ?? '');
                $updated++; return;
            } elseif ($o['on_conflict'] === 'duplicate') {
                // fallthrough => create new
            }
        }

        $q = Question::create($base + ['author_id' => $o['author_id']]);

        $this->syncByType($q, $r);
        $this->syncTags($q, $r['tags_csv'] ?? '');

        $created++;
    }

    private function syncByType(Question $q, array $r): void
    {
        $type = optional($q->type)->name;

        // پاک‌سازی قبلی‌ها
        $q->options()->delete();
        $q->pairs()->delete();
        $q->blanks()->delete();

        if ($type === 'mcq') {
            $options = $this->jsonOrEmpty($r['options_json'] ?? '[]');
            if (!is_array($options) || !count($options)) {
                throw new RuntimeException('mcq requires options_json');
            }
            foreach ($options as $i => $op) {
                $label = $op['label'] ?? chr(65 + $i); // A,B,C,..
                $text  = trim((string)($op['text'] ?? ''));
                if ($text === '') continue;
                $q->options()->create([
                    'label'      => $label,
                    'text'       => $text,
                    'is_correct' => (bool)($op['is_correct'] ?? false),
                ]);
            }
        }
        elseif ($type === 'match') {
            $pairs = $this->jsonOrEmpty($r['pairs_json'] ?? '[]');
            if (!is_array($pairs) || !count($pairs)) {
                throw new RuntimeException('match requires pairs_json');
            }
            foreach ($pairs as $pair) {
                $left = trim((string)($pair['left'] ?? ''));
                $right= trim((string)($pair['right'] ?? ''));
                if ($left === '' || $right === '') continue;
                $q->pairs()->create([
                    'left_text'  => $left,
                    'right_text' => $right,
                    'match_key'  => $this->nullIfEmpty($pair['key'] ?? null),
                ]);
            }
        }
        elseif ($type === 'fill_blank') {
            $blanks = $this->jsonOrEmpty($r['blanks_json'] ?? '[]');
            if (!is_array($blanks) || !count($blanks)) {
                throw new RuntimeException('fill_blank requires blanks_json');
            }
            foreach ($blanks as $b) {
                $idx = (int)($b['index'] ?? 0);
                $txt = trim((string)($b['text'] ?? ''));
                if ($idx <= 0 || $txt === '') continue;
                $q->blanks()->create([
                    'blank_index'  => $idx,
                    'correct_text' => $txt,
                ]);
            }
        }
        // descriptive / short_answer نیاز به ساختار خاص ندارند؛ answer_text کافیست
    }

    private function syncTags(Question $q, string $csv): void
    {
        $slugs = collect(explode(',', (string)$csv))
            ->map(fn($s) => trim($s))
            ->filter()
            ->map(fn($s) => Str::slug($s))
            ->unique()
            ->values();

        if ($slugs->isEmpty()) {
            $q->tags()->sync([]);
            return;
        }

        $tagIds = [];
        foreach ($slugs as $slug) {
            $tag = QuestionTag::firstOrCreate(['slug'=>$slug], ['name'=>$slug]);
            $tagIds[] = $tag->id;
        }
        $q->tags()->sync($tagIds);
    }

    private function resolveSubchapter(array $r): ?Subchapter
    {
        $subName = trim((string)($r['subchapter'] ?? ''));
        if (!$subName) return null;

        $query = Subchapter::query()->where('title', $subName);

        // اگر grade/book/chapter هم آمده، دقیق‌تر کن
        if ($chapter = $this->nullIfEmpty($r['chapter'] ?? null)) {
            $query->whereHas('chapter', fn($q) => $q->where('name',$chapter));
        }
        if ($book = $this->nullIfEmpty($r['book'] ?? null)) {
            $query->whereHas('chapter.book', fn($q) => $q->where('title',$book));
        }
        if ($grade = $this->nullIfEmpty($r['grade'] ?? null)) {
            $query->whereHas('chapter.book.grade', fn($q) => $q->where('name',$grade));
        }

        return $query->first();
    }

    private function jsonOrEmpty(?string $s)
    {
        $s = trim((string)$s);
        if ($s === '') return [];
        return json_decode($s, true) ?? [];
    }

    private function nullIfEmpty($v)
    {
        $v = is_string($v) ? trim($v) : $v;
        return ($v === '' || $v === null) ? null : $v;
    }

    private function intOrNull($v): ?int
    {
        if ($v === '' || $v === null) return null;
        return (int) $v;
    }

    private function toBool($v, $default = false): bool
    {
        if ($v === '' || $v === null) return (bool)$default;
        if (is_bool($v)) return $v;
        $s = strtolower(trim((string)$v));
        return in_array($s, ['1','true','yes','y','on'], true);
    }

    private function safeEnum($v, array $allowed)
    {
        if ($v === null || $v === '') return null;
        $v = strtolower(trim((string)$v));
        return in_array($v, $allowed, true) ? $v : null;
    }
}
