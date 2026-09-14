<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\Curriculum\Book;

class BookController extends Controller
{
    public function index(Request $r)
    {
        Gate::authorize('catalog.manage');

        $q = Book::query()
            ->with(['subject:id,name','grade:id,name'])
            ->withCount('chapters')
            ->orderBy('id');

        if ($search = $r->query('q')) {
            $q->where('title', 'like', "%{$search}%");
        }
        if ($r->filled('grade_id')) {
            $q->where('grade_id', $r->integer('grade_id'));
        }
        if ($r->filled('subject_id')) {
            $q->where('subject_id', $r->integer('subject_id'));
        }
        if ($r->filled('year')) {
            $q->where('year', $r->integer('year'));
        }

        $books = $q->paginate($r->integer('per', 20));

        return response()->json([
            'code' => 'OK',
            'message' => 'Books list',
            'data' => $books->through(function (Book $b) {
                return [
                    'id' => $b->id,
                    'title' => $b->title,
                    'year' => $b->year,
                    'grade' => [
                        'id' => $b->grade_id,
                        'name' => $b->grade?->name,
                    ],
                    'subject' => [
                        'id' => $b->subject_id,
                        'name' => $b->subject?->name,
                    ],
                    'chapters_cnt' => $b->chapters_count,
                ];
            }),
            'meta' => [
                'current_page' => $books->currentPage(),
                'per_page'     => $books->perPage(),
                'total'        => $books->total(),
            ],
        ]);
    }

    public function store(Request $r)
    {
        Gate::authorize('catalog.manage');

        $data = $r->validate([
            'subject_id' => ['required','integer','exists:subjects,id'],
            'grade_id'   => ['required','integer','exists:grades,id'],
            'title'      => ['required','string','max:150'],
            'year'       => ['required','integer','between:1300,1600'],
            'numberOfChapters' => ['nullable','integer','min:1','max:30'],
        ]);

        // Extract numberOfChapters (not a database column)
        $numberOfChapters = $data['numberOfChapters'] ?? null;
        unset($data['numberOfChapters']);

        $book = Book::create($data);

        // Auto-create chapters if numberOfChapters is provided
        if ($numberOfChapters) {
            $persianOrdinals = [
                1 => 'اول', 2 => 'دوم', 3 => 'سوم', 4 => 'چهارم', 5 => 'پنجم',
                6 => 'ششم', 7 => 'هفتم', 8 => 'هشتم', 9 => 'نهم', 10 => 'دهم',
                11 => 'یازدهم', 12 => 'دوازدهم', 13 => 'سیزدهم', 14 => 'چهاردهم', 15 => 'پانزدهم',
                16 => 'شانزدهم', 17 => 'هفدهم', 18 => 'هجدهم', 19 => 'نوزدهم', 20 => 'بیستم',
                21 => 'بیست و یکم', 22 => 'بیست و دوم', 23 => 'بیست و سوم', 24 => 'بیست و چهارم',
                25 => 'بیست و پنجم', 26 => 'بیست و ششم', 27 => 'بیست و هفتم', 28 => 'بیست و هشتم',
                29 => 'بیست و نهم', 30 => 'سی‌ام'
            ];

            for ($i = 1; $i <= $numberOfChapters; $i++) {
                $book->chapters()->create([
                    'number' => $i,
                    'title' => 'فصل ' . ($persianOrdinals[$i] ?? $i),
                    'start_page' => null,
                    'end_page' => null,
                ]);
            }
        }

        return response()->json([
            'code' => 'OK',
            'message' => 'Book created',
            'data' => [
                'id' => $book->id,
            ],
        ], 201);
    }

    public function show(Book $book)
    {
        Gate::authorize('catalog.manage');

        $book->load(['subject:id,name','grade:id,name'])->loadCount('chapters');

        return response()->json([
            'code' => 'OK',
            'message' => 'Book detail',
            'data' => [
                'id' => $book->id,
                'title' => $book->title,
                'year' => $book->year,
                'grade' => ['id'=>$book->grade_id,'name'=>$book->grade?->name],
                'subject' => ['id'=>$book->subject_id,'name'=>$book->subject?->name],
                'chapters_cnt' => $book->chapters_count,
                'created_at' => optional($book->created_at)->toDateTimeString(),
                'updated_at' => optional($book->updated_at)->toDateTimeString(),
            ],
        ]);
    }

    public function update(Request $r, Book $book)
    {
        Gate::authorize('catalog.manage');

        $data = $r->validate([
            'subject_id' => ['sometimes','integer','exists:subjects,id'],
            'grade_id'   => ['sometimes','integer','exists:grades,id'],
            'title'      => ['sometimes','string','max:150'],
            'year'       => ['sometimes','integer','between:1300,1600'],
        ]);

        $book->update($data);

        return response()->json([
            'code' => 'OK',
            'message' => 'Book updated',
            'data' => [
                'id' => $book->id,
            ],
        ]);
    }

    public function destroy(Book $book)
    {
        Gate::authorize('catalog.manage');

        // Delete the book (chapters will be cascade deleted due to foreign key constraint)
        $book->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Book deleted',
            'data' => null,
        ]);
    }
}
