<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Content\Content;
use App\Models\Content\ContentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class SampleQuestionController extends Controller
{
    public function index(Request $r)
    {
        // پیدا کردن نوع محتوا برای نمونه سوالات
        $sampleType = ContentType::where('name', 'نمونه‌سؤال')
            ->orWhere('slug', 'sample')
            ->first();
        
        if (!$sampleType) {
            return response()->json([
                'code' => 'OK',
                'message' => 'Sample Questions',
                'data' => ['items' => [], 'pagination' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0]]
            ]);
        }
        
        $q = Content::where('type_id', $sampleType->id)
            ->with(['media', 'subchapter.chapter.book.grade', 'subchapter.chapter.book.subject'])
            ->orderByDesc('id');
            
        // فیلترها
        if ($r->filled('q')) {
            $q->where('title','like','%'.$r->query('q').'%');
        }
        
        if ($r->filled('grade_id')) {
            $q->whereHas('subchapter.chapter.book', fn($query) => $query->where('grade_id', $r->query('grade_id')));
        }
        
        if ($r->filled('subject_id')) {
            $q->whereHas('subchapter.chapter.book', fn($query) => $query->where('subject_id', $r->query('subject_id')));
        }
        
        if ($r->filled('is_free')) {
            $q->where('is_free', $r->boolean('is_free'));
        }
        
        $items = $q->paginate($r->integer('per_page', 20));
        
        $sampleQuestions = $items->map(function($c) {
            $pdf = $c->media()->where('kind', 'pdf')->first();
            return [
                'id' => $c->id,
                'title' => $c->title,
                'description' => $c->description,
                'is_free' => $c->is_free,
                'token_price' => $c->token_price ?? 0,
                'has_pdf' => !!$pdf,
                'grade_id' => $c->subchapter?->chapter?->book?->grade_id,
                'grade_name' => $c->subchapter?->chapter?->book?->grade?->name,
                'subject_name' => $c->subchapter?->chapter?->book?->subject?->name,
                'book' => [
                    'id' => $c->subchapter?->chapter?->book?->id,
                    'title' => $c->subchapter?->chapter?->book?->title,
                ],
                'chapter' => $c->subchapter?->chapter?->title,
                'pages' => $c->pages ?? 0,
                'view_count' => $c->view_count ?? 0,
                'download_count' => $c->download_count ?? 0,
                'created_at' => $c->created_at,
                'updated_at' => $c->updated_at,
            ];
        });
        
        return response()->json([
            'code' => 'OK',
            'message' => 'Sample Questions',
            'data' => [
                'items' => $sampleQuestions,
                'pagination' => [
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                    'per_page' => $items->perPage(),
                    'total' => $items->total()
                ]
            ]
        ]);
    }

    public function show($id)
    {
        $sampleType = ContentType::where('name', 'نمونه‌سؤال')
            ->orWhere('slug', 'sample')
            ->first();
            
        if (!$sampleType) {
            return response()->json(['code' => 'NOT_FOUND', 'message' => 'Sample question not found'], 404);
        }
        
        $c = Content::where('id', $id)
            ->where('type_id', $sampleType->id)
            ->with(['media', 'subchapter.chapter.book.grade', 'subchapter.chapter.book.subject'])
            ->first();
            
        if (!$c) {
            return response()->json(['code' => 'NOT_FOUND', 'message' => 'Sample question not found'], 404);
        }
        
        $pdf = $c->media()->where('kind', 'pdf')->first();
        
        return response()->json([
            'code' => 'OK',
            'message' => 'Sample Question',
            'data' => [
                'id' => $c->id,
                'title' => $c->title,
                'description' => $c->description,
                'is_free' => $c->is_free,
                'token_price' => $c->token_price ?? 0,
                'has_pdf' => !!$pdf,
                'grade_id' => $c->subchapter?->chapter?->book?->grade_id,
                'grade_name' => $c->subchapter?->chapter?->book?->grade?->name,
                'subject_name' => $c->subchapter?->chapter?->book?->subject?->name,
                'book' => [
                    'id' => $c->subchapter?->chapter?->book?->id,
                    'title' => $c->subchapter?->chapter?->book?->title,
                ],
                'chapter' => $c->subchapter?->chapter?->title,
                'pages' => $c->pages ?? 0,
                'view_count' => $c->view_count ?? 0,
                'download_count' => $c->download_count ?? 0,
                'created_at' => $c->created_at,
                'updated_at' => $c->updated_at,
            ]
        ]);
    }

    public function trackView($id)
    {
        $sampleType = ContentType::where('name', 'نمونه‌سؤال')
            ->orWhere('slug', 'sample')
            ->first();
            
        if (!$sampleType) {
            return response()->noContent();
        }
        
        $c = Content::where('id', $id)
            ->where('type_id', $sampleType->id)
            ->first();
            
        if ($c) {
            $c->increment('view_count');
        }
        
        return response()->noContent();
    }

    public function download(Request $request, $id)
    {
        $user = $request->user();
        $sampleType = ContentType::where('name', 'نمونه‌سؤال')
            ->orWhere('slug', 'sample')
            ->first();
            
        if (!$sampleType) {
            return response()->json(['code' => 'NOT_FOUND', 'message' => 'نمونه سوال یافت نشد'], 404);
        }
        
        $c = Content::where('id', $id)
            ->where('type_id', $sampleType->id)
            ->with('media')
            ->first();
            
        if (!$c) {
            return response()->json(['code' => 'NOT_FOUND', 'message' => 'نمونه سوال یافت نشد'], 404);
        }
        
        // چک دسترسی
        if (!$c->is_free) {
            $price = $c->token_price ?? 0;
            
            if (!$user) {
                return response()->json(['code' => 'UNAUTHORIZED', 'message' => 'برای دانلود باید وارد شوید'], 401);
            }
            
            if ($user->tokens < $price) {
                return response()->json([
                    'code' => 'INSUFFICIENT_TOKENS',
                    'message' => 'توکن کافی ندارید',
                    'required' => $price,
                    'current' => $user->tokens
                ], 402);
            }
            
            // کسر توکن
            if ($price > 0) {
                DB::transaction(function() use ($user, $price, $c) {
                    $user->decrement('tokens', $price);
                    DB::table('token_transactions')->insert([
                        'user_id' => $user->id,
                        'amount' => -$price,
                        'type' => 'sample_question_download',
                        'description' => "دانلود نمونه سوال: {$c->title}",
                        'reference_id' => $c->id,
                        'created_at' => now()
                    ]);
                });
            }
        }
        
        $pdf = $c->media()->where('kind', 'pdf')->first();
        
        if (!$pdf) {
            return response()->json(['code' => 'NOT_FOUND', 'message' => 'فایل PDF یافت نشد'], 404);
        }
        
        if (!Storage::exists($pdf->storage_path)) {
            return response()->json(['code' => 'NOT_FOUND', 'message' => 'فایل در سرور وجود ندارد'], 404);
        }
        
        // Increment download count
        $c->increment('download_count');
        
        return response()->download(
            Storage::path($pdf->storage_path),
            $c->title . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }
}
