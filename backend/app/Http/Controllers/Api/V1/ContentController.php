<?php
// app/Http/Controllers/Api/V1/Content/ContentController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Content\Content;
use App\Services\Access\SubscriptionAccessService;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function show(Request $r, Content $content, SubscriptionAccessService $access)
    {
        // اگر نخواستی میدلور بذاری، همین‌جا چک کن:
        if (! $access->userCanAccessContent($r->user(), $content)) {
            return response()->json([
                'code'=>'FORBIDDEN',
                'message'=>'You do not have access to this content with your current plan.',
                'data'=>null
            ], 403);
        }

        return response()->json([
            'code'=>'OK',
            'message'=>'Content detail',
            'data'=>[
                'id'            => $content->id,
                'title'         => $content->title,
                'description'   => $content->description,
                'subchapter_id' => $content->subchapter_id,
                'is_free'       => (bool)$content->is_free,
            ]
        ]);
    }
}
