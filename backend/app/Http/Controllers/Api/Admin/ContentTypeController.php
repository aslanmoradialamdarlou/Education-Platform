<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Content\ContentType;

class ContentTypeController extends Controller
{
    public function index(Request $r)
    {
        $types = ContentType::query()
            ->orderBy('id')
            ->get(['id','name','slug']);

        return response()->json([
            'code' => 'OK',
            'message' => 'Content types',
            'data' => $types,
        ]);
    }
}
