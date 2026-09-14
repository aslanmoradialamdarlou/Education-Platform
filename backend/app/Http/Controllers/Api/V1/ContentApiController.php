<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentResource;
use App\Models\Content\Content;
use App\Models\Curriculum\Subchapter;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Cache;

class ContentApiController extends Controller
{
    /**
     * GET /api/v1/contents?type=video&grade_id=7&per_page=12&page=1
     * Returns a paginated list of contents filtered by type, grade, etc.
     */
    public function index(Request $request)
    {
        
        
        $validated = $request->validate([
            'type'       => ['nullable', 'string'],
            'type_id'    => ['nullable', 'integer', 'min:1'],
            'grade_id'   => ['nullable', 'integer', 'min:1'],
            'book_id'    => ['nullable', 'integer', 'min:1'],
            'chapter_id' => ['nullable', 'integer', 'min:1'],
            'is_free'    => ['nullable', 'boolean'],
            'q'          => ['nullable', 'string', 'max:255'],
            'page'       => ['nullable', 'integer', 'min:1'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:100'],
            'subject'    => ['nullable', 'string'],
        ]);

        $query = Content::query()
            ->select('contents.*')
            ->with(['type', 'subchapter.chapter.book.grade']);

        $query->whereNotNull('subchapter_id');
            // ->with(['type', 'subchapter.chapter.book.grade']);
        // Filter by type (slug or name)
        if (!empty($validated['type_id'])) {
            $query->where('contents.type_id', (int) $validated['type_id']);
        } elseif (!empty($validated['type'])) {
            $query->whereHas('type', function ($q) use ($validated) {
                $q->where('slug', $validated['type'])
                  ->orWhere('name', $validated['type']);
            });
        }

        // Filter by grade
        if (!empty($validated['grade_id'])) {
            $query->whereHas('subchapter.chapter.book', function ($q) use ($validated) {
                $q->where('grade_id', $validated['grade_id']);
            });
        }

        // Filter by book
        if (!empty($validated['book_id'])) {
            $query->whereHas('subchapter.chapter', function ($q) use ($validated) {
                $q->where('book_id', $validated['book_id']);
            });
        }

        // Filter by chapter
        if (!empty($validated['chapter_id'])) {
            $query->whereHas('subchapter', function ($q) use ($validated) {
                $q->where('chapter_id', $validated['chapter_id']);
            });
        }

        // Filter by is_free
        if (isset($validated['is_free'])) {
            $query->where('is_free', $validated['is_free']);
        }

        // Search by title
        if (!empty($validated['q'])) {
            $query->where('title', 'like', '%' . $validated['q'] . '%');
        }

        $perPage = $validated['per_page'] ?? 12;
        $contents = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'code' => 'OK',
            'message' => 'Contents list',
            'data' => [
                'items' => ContentResource::collection($contents->items()),
                'pagination' => [
                    'total' => $contents->total(),
                    'per_page' => $contents->perPage(),
                    'current_page' => $contents->currentPage(),
                    'last_page' => $contents->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/contents/count?type=video|booklet|sample
     * Returns a global total for contents filtered by type (slug in content_types).
     */
    public function count(Request $r)
    {
        $data = $r->validate([
            'type'    => ['nullable','string'],
            'type_id' => ['nullable','integer','min:1'],
        ]);

        $q = Content::query();
        if (!empty($data['type_id'])) {
            $q->where('contents.type_id', (int) $data['type_id']);
        } elseif (!empty($data['type'])) {
            // Faster than whereHas: direct join on content_types with indexed slug/name
            $q->join('content_types','content_types.id','=','contents.type_id')
              ->where(function($w) use ($data) {
                  $w->where('content_types.slug', $data['type'])
                    ->orWhere('content_types.name', $data['type']);
              });
        }

        $cacheKey = 'contents.count.'.($data['type_id'] ?? ($data['type'] ?? 'all'));
        $total = Cache::remember($cacheKey, 60, function () use ($q) {
            return (int) $q->count();
        });

        return response()->json([
            'code'    => 'OK',
            'message' => 'Contents count',
            'data'    => [ 'total' => $total ],
        ]);
    }

    /**
     * GET /api/v1/contents/counts?types=video,booklet,sample
     * Batch counts for multiple content types to minimize round-trips.
     */
    public function counts(Request $r)
    {
        $types = $r->query('types');
        $typeList = is_string($types) && strlen($types)
            ? array_values(array_filter(array_map('trim', explode(',', $types))))
            : null; // null => return all types

        if (is_array($typeList) && empty($typeList)) {
            $typeList = null; // treat empty as all
        }

        // When types are specified, filter; otherwise return all types
        if ($typeList) {
            $cacheKey = 'contents.counts.'.implode(',', $typeList);
            $rows = Cache::remember($cacheKey, 60, function () use ($typeList) {
                return Content::query()
                    ->join('content_types','content_types.id','=','contents.type_id')
                    ->whereIn('content_types.slug', $typeList)
                    ->groupBy('content_types.slug')
                    ->selectRaw('content_types.slug as type, COUNT(*) as total')
                    ->pluck('total','type');
            });
            $data = [];
            foreach ($typeList as $t) { $data[$t] = (int) ($rows[$t] ?? 0); }
        } else {
            // All types: get all content_types and their counts (0 for types with no content)
            $cacheKey = 'contents.counts.ALL';
            $data = Cache::remember($cacheKey, 60, function () {
                // Get counts for types that have content
                $counts = Content::query()
                    ->join('content_types','content_types.id','=','contents.type_id')
                    ->groupBy('content_types.slug')
                    ->selectRaw('content_types.slug as type, COUNT(*) as total')
                    ->pluck('total','type');
                
                // Get all content types from database
                $allTypes = \App\Models\Content\ContentType::whereNotNull('slug')
                    ->pluck('slug')
                    ->toArray();
                
                // Build result with 0 for missing types
                $result = [];
                foreach ($allTypes as $slug) {
                    $result[$slug] = (int) ($counts[$slug] ?? 0);
                }
                
                return $result;
            });
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Contents counts',
            'data'    => $data,
        ]);
    }
    
    /**
     * GET /api/v1/subchapters/{id}/contents?type=&free=&q=&per=&page=
     *
     * type:   video|booklet|sample  (ترجیحاً از ستون slug در content_types)
     * free:   1|0|true|false
     * q:      جستجو در عنوان/توضیح
     * per:    تعداد در صفحه (پیش‌فرض 12، سقف 50)
     * sort:   newest (پیش‌فرض) | oldest
     */
    public function indexBySubchapter($subchapterId, Request $r)
    {
        // اعتبارسنجی ورودی‌ها
        $data = $r->validate([
            'type' => ['nullable','string', Rule::in(['video','booklet','sample'])],
            'free' => ['nullable','string'], // true/false/1/0
            'q'    => ['nullable','string','max:200'],
            'per'  => ['nullable','integer','min:1','max:50'],
            'sort' => ['nullable','string', Rule::in(['newest','oldest'])],
        ]);

        $per  = $data['per']  ?? 12;
        $sort = $data['sort'] ?? 'newest';

        // اطمینان از وجود زیر‌فصل
        $subchapter = Subchapter::findOrFail($subchapterId);

        // بیلد کوئری
        $query = Content::query()
            ->where('subchapter_id', $subchapter->id)
            ->with(['type:id,name,slug', 'subchapter:id,number,title']);

        // فیلتر نوع (type) — با ستون slug در content_types
        if (!empty($data['type'])) {
            $query->whereHas('type', function ($q) use ($data) {
                $q->where('slug', $data['type'])
                    ->orWhere('name', $data['type']); // fallback اگر slug نداشتی
            });
        }

        // فیلتر رایگان/غیررایگان
        if (isset($data['free'])) {
            $free = filter_var($data['free'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($free !== null) {
                $query->where('is_free', $free);
            }
        }

        // جستجو
        if (!empty($data['q'])) {
            $q = trim($data['q']);
            $query->where(function ($qq) use ($q) {
                $qq->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        // مرتب‌سازی
        if ($sort === 'oldest') {
            $query->orderBy('created_at', 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // صفحه‌بندی
        $paginator = $query->paginate($per)->appends($r->query());

        // خروجی
        return response()->json([
            'code'    => 'OK',
            'message' => 'Contents retrieved successfully',
            'data'    => ContentResource::collection($paginator->items()),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/contents/{id}
     * Returns a single content by ID
     */
    public function show($id)
    {
        $content = Content::with(['type', 'subchapter.chapter.book.grade'])
            ->findOrFail($id);

        return response()->json([
            'code'    => 'OK',
            'message' => 'Content retrieved successfully',
            'data'    => new ContentResource($content),
        ]);
    }
}
