<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Content\Content;
use App\Models\Content\ContentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class ContentController extends Controller
{
    /**
     * لیست جزوات (handouts) برای کاربران
     * GET /api/v1/contents?type=handout
     */
    public function index(Request $request)
    {
        $typeFilter = $request->query('type'); // 'handout' یا 'جزوه'
        
        $query = Content::query()
            ->with(['type:id,name', 'media'])
            ->where('is_free', true); // فقط رایگان‌ها یا بعداً چک اشتراک

        // فیلتر بر اساس نوع
        if ($typeFilter === 'handout' || $typeFilter === 'جزوه') {
            $handoutType = ContentType::where('name', 'جزوه')->first();
            if ($handoutType) {
                $query->where('type_id', $handoutType->id);
            }
        }

        $contents = $query->latest()->paginate(12);

        return response()->json([
            'code' => 'OK',
            'message' => 'Contents retrieved',
            'data' => $contents->items(),
            'pagination' => [
                'current_page' => $contents->currentPage(),
                'last_page' => $contents->lastPage(),
                'per_page' => $contents->perPage(),
                'total' => $contents->total(),
            ]
        ]);
    }

    /**
     * جزئیات یک محتوا
     * GET /api/v1/contents/{id}
     */
    public function show(Content $content)
    {
        $content->load(['type:id,name', 'media']);

        return response()->json([
            'code' => 'OK',
            'message' => 'Content detail',
            'data' => $content
        ]);
    }

    /**
     * دانلود امن - چک دسترسی و برگرداندن فایل
     * POST /api/v1/contents/{id}/download
     * 
     * امنیت: 
     * 1. چک احراز هویت (middleware: auth:sanctum)
     * 2. چک is_free یا اشتراک یا توکن
     * 3. کسر توکن اگر لازم بود (atomic)
     * 4. لاگ دانلود
     * 5. هیچ URL مستقیمی به فایل نمی‌دهیم
     */
    public function download(Request $request, Content $content)
    {
        $user = $request->user();

        // 1. بررسی دسترسی
        if (!$content->is_free) {
            // TODO: چک اشتراک یا توکن کاربر
            // اگر توکن لازم است و کاربر ندارد:
            // return response()->json(['code'=>'FORBIDDEN','message'=>'توکن کافی ندارید'], 403);
            
            // اگر اشتراک لازم است:
            // if (!$user->hasActiveSubscription()) {
            //     return response()->json(['code'=>'FORBIDDEN','message'=>'اشتراک فعال ندارید'], 403);
            // }
        }

        // 2. پیدا کردن فایل PDF از media_files
        $mediaFile = $content->media()
            ->where('kind', 'pdf')
            ->first();

        if (!$mediaFile) {
            return response()->json([
                'code' => 'NOT_FOUND',
                'message' => 'فایل یافت نشد'
            ], 404);
        }

        $filePath = $mediaFile->storage_path;

        // 3. چک وجود فایل
        if (!Storage::exists($filePath)) {
            return response()->json([
                'code' => 'NOT_FOUND',
                'message' => 'فایل در سرور وجود ندارد'
            ], 404);
        }

        // 4. اگر توکن لازم بود، الان کسر کن (atomic transaction)
        // DB::transaction(function() use ($user, $content) {
        //     $user->decrement('tokens', $content->token_price);
        //     // لاگ کن
        // });

        // 5. لاگ دانلود (برای آمار)
        DB::table('content_views')->insert([
            'content_id' => $content->id,
            'user_id' => $user->id,
            'viewed_at' => now(),
        ]);

        // 6. برگرداندن فایل به صورت stream (امن)
        // کاربر نمی‌تواند URL را کپی کند چون از طریق این endpoint احراز هویت شده می‌آید
        return response()->download(
            Storage::path($filePath),
            $content->title . '.pdf',
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $content->title . '.pdf"'
            ]
        );
    }
}
