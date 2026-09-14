<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Question\QuestionType;

class QuestionTypeController extends Controller
{
    public function __construct()
    {
        // Accept both canonical 'admin' and legacy/alternate 'Administrator' role names using the 'api' guard.
        $this->middleware(['auth:sanctum','role:admin|Administrator,api']);
    }

    public function index()
    {
        $types = QuestionType::select('id','name')->orderBy('id')->get();
        return response()->json([
            'code' => 'OK',
            'message' => 'Question types',
            'data' => $types
        ]);
    }
}
