<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Curriculum\Book;

class BookApiController extends Controller
{
    public function chapters($bookId)
    {
        $book = Book::with(['chapters' => function ($q) {
            $q->orderBy('number');
        }])->findOrFail($bookId);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Chapters retrieved successfully',
            'data'    => $book->chapters->map(fn ($ch) => [
                'id'     => $ch->id,
                'title'  => $ch->title,
                'number' => $ch->number, // 👈 خروجی استاندارد
            ]),
        ]);
    }
}
