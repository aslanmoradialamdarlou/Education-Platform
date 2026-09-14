<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Curriculum\Chapter;

class ChapterApiController extends Controller
{
    public function subchapters($chapterId)
    {
        $chapter = Chapter::with(['subchapters' => fn($q) => $q->orderBy('number')])
            ->findOrFail($chapterId);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Subchapters retrieved successfully',
            'data'    => $chapter->subchapters->map(fn($sc) => [
                'id'     => $sc->id,
                'title'  => $sc->title,
                'number' => $sc->number,
            ]),
        ]);
    }
}
