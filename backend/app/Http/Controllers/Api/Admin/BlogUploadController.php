<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BlogUploadController extends Controller
{
    public function __construct()
    {
        // Align with admin routes: accept both 'admin' and 'Administrator' role names
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
        // یا: $this->middleware('permission:blog.manage');
    }

    public function store(Request $r)
    {
        $r->validate([
            'file' => ['required','image','mimes:jpg,jpeg,png,webp','max:4096'],
        ]);

        // Resolve upload target (disk and base path) from config/uploads.php for easy switching (public <-> s3/CDN)
        $disk = config('uploads.blog.disk', 'public');
        $basePath = config('uploads.blog.path', 'blog');

        // Extra options for cloud/object storage (e.g., S3): public visibility + long-term caching
        $options = [];
        $driver = config("filesystems.disks.$disk.driver");
        if ($driver === 's3') {
            $options = [
                'visibility'   => 'public',
                'CacheControl' => 'public, max-age=31536000, immutable',
            ];
        }

        $storeOptions = array_merge(['disk' => $disk], $options);
        $path = $r->file('file')->store($basePath, $storeOptions);

        // Generate a public URL using config. For S3, set the disk 'url' to your CDN domain.
        $diskCfg = config("filesystems.disks.$disk", []);
        if (($diskCfg['driver'] ?? null) === 's3') {
            $base = rtrim((string)($diskCfg['url'] ?? ''), '/');
            // If a CDN/base URL is configured, use it; otherwise fall back to default app URL pattern
            $url = $base ? ($base . '/' . ltrim($path, '/')) : (rtrim(config('app.url'), '/') . '/' . ltrim($path, '/'));
        } else {
            // local/public driver: serve via /storage (requires `php artisan storage:link`)
            $url = asset('storage/' . $path);
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Uploaded',
            'data'    => [
                'url' => $url,
                'path'=> $path,
            ],
        ], 201);
    }
}
