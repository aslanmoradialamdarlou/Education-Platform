<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Content\Content;
use App\Models\Content\MediaFile;
use App\Http\Requests\Admin\ContentUpdateRequest;
use App\Http\Requests\Admin\ContentStoreRequest;
use App\Http\Resources\Admin\ContentResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContentController extends Controller
{
    public function index(Request $r)
    {
        $q = Content::query()
            ->with(['type','subchapter.chapter.book.grade','subchapter.chapter.book.subject'])
            ->orderByDesc('id');

        if ($r->filled('type_id')) {
            $q->where('type_id', $r->integer('type_id'));
        }
        if ($r->filled('subchapter_id')) {
            $q->where('subchapter_id', $r->integer('subchapter_id'));
        }
        if ($r->has('is_free')) {
            $q->where('is_free', (bool) $r->input('is_free'));
        }
        if ($search = $r->query('q')) {
            $q->where('title', 'like', "%{$search}%");
        }

    $perPage = $r->integer('per_page', $r->integer('per', 20));
    $rows = $q->paginate($perPage);

        return response()->json([
            'code' => 'OK',
            'message' => 'Contents list',
            'data' => ContentResource::collection($rows),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'per_page'     => $rows->perPage(),
                'total'        => $rows->total(),
            ],
        ]);
    }

    public function store(ContentStoreRequest $r)
    {
        $data = $r->validated();
        
        // حذف pdf_file از data چون نباید در content ذخیره شود
        unset($data['pdf_file']);
        
        $content = Content::create($data);

        // آپلود PDF اگر وجود داشت
        if ($r->hasFile('pdf_file')) {
            $this->uploadPdfFile($r->file('pdf_file'), $content);
        }

        return response()->json([
            'code' => 'OK',
            'message' => 'Content created',
            'data' => new ContentResource($content->load(['type','subchapter.chapter.book.grade','subchapter.chapter.book.subject','media'])),
        ], 201);
    }

    public function show(Content $content)
    {
    $content->load(['type','subchapter.chapter.book.grade','subchapter.chapter.book.subject']);

        return response()->json([
            'code' => 'OK',
            'message' => 'Content detail',
            'data' => new ContentResource($content),
        ]);
    }

    public function update(ContentUpdateRequest $r, Content $content)
    {
        $data = $r->validated();
        
        // حذف pdf_file از data
        unset($data['pdf_file']);
        
        $content->update($data);

        // آپلود PDF جدید اگر وجود داشت
        if ($r->hasFile('pdf_file')) {
            // حذف PDF قدیمی
            $oldMedia = $content->media()->where('kind', 'pdf')->first();
            if ($oldMedia) {
                Storage::delete($oldMedia->storage_path);
                $oldMedia->delete();
            }
            
            // آپلود فایل جدید
            $this->uploadPdfFile($r->file('pdf_file'), $content);
        }

        return response()->json([
            'code' => 'OK',
            'message' => 'Content updated',
            'data' => new ContentResource($content->fresh()->load(['type','subchapter.chapter.book.grade','subchapter.chapter.book.subject','media'])),
        ]);
    }

    public function destroy(Content $content)
    {
        // حذف فایل‌های media مرتبط
        foreach ($content->media as $media) {
            Storage::delete($media->storage_path);
            $media->delete();
        }
        
        $content->delete();

        return response()->json([
            'code' => 'OK',
            'message' => 'Content deleted',
            'data' => null,
        ]);
    }

    /**
     * آپلود فایل PDF و ذخیره در media_files
     */
    protected function uploadPdfFile($file, Content $content)
    {
        $fileName = Str::uuid() . '.pdf';
        $path = $file->storeAs('contents/pdfs/' . date('Y/m'), $fileName, config('filesystems.default'));

        MediaFile::create([
            'owner_type' => 'contents',
            'owner_id' => $content->id,
            'kind' => 'pdf',
            'storage_path' => $path,
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
            'meta' => json_encode([
                'original_name' => $file->getClientOriginalName(),
                'uploaded_at' => now()->toDateTimeString(),
            ]),
        ]);
    }
}
