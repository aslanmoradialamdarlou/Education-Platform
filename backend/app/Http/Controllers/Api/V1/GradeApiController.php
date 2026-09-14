<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\Curriculum\Grade;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class GradeApiController extends Controller
{
    /**
     * @OA\Get(
     *   path="/api/v1/grades/{gradeId}/books",
     *   summary="کتاب‌های علوم برای یک پایه",
     *   tags={"Catalog"},
     *   @OA\Parameter(
     *     name="gradeId", in="path", required=true, description="شناسه پایه",
     *     @OA\Schema(type="integer", example=1)
     *   ),
     *   @OA\Response(
     *     response=200, description="OK",
     *     @OA\JsonContent(
     *       type="object",
     *       @OA\Property(property="code", type="string", example="OK"),
     *       @OA\Property(property="message", type="string", example="Books list"),
     *       @OA\Property(property="data", type="array",
     *         @OA\Items(
     *           type="object",
     *           @OA\Property(property="id", type="integer", example=10),
     *           @OA\Property(property="subject", type="object",
     *             @OA\Property(property="id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="علوم")
     *           ),
     *           @OA\Property(property="grade", type="object",
     *             @OA\Property(property="id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="هفتم")
     *           ),
     *           @OA\Property(property="title", type="string", example="علوم هفتم"),
     *           @OA\Property(property="year", type="integer", example=2024),
     *           @OA\Property(property="chapters_count", type="integer", example=15)
     *         )
     *       )
     *     )
     *   ),
     *   @OA\Response(
     *     response=404, description="Not Found",
     *     @OA\JsonContent(
     *       type="object",
     *       @OA\Property(property="code", type="string", example="NOT_FOUND"),
     *       @OA\Property(property="message", type="string", example="Grade not found"),
     *       @OA\Property(property="data", type="null", nullable=true)
     *     )
     *   )
     * )
     */
    public function books(Request $request, Grade $grade)
    {
        // نکته: اگر فقط «علوم» داریم، همین فیلتر کافی‌ست. اگر در آینده چند درس شد، از subject=علوم فیلتر می‌کنی.
        $books = $grade->books()
            ->with(['subject','grade'])        // eager load برای جلوگیری از N+1
            ->withCount('chapters')            // بدرد UI می‌خوره
            ->orderBy('year','desc')
            ->get();

        return response()->json([
            'code'    => 'OK',
            'message' => 'Books list',
            'data'    => BookResource::collection($books),
        ]);
    }

    /**
     * GET /api/v1/grades
     * Return list of grades (id, name)
     */
    public function grades()
    {
        $list = Grade::orderBy('id')->get(['id','name']);
        return response()->json([
            'code' => 'OK',
            'message' => 'Grades list',
            'data' => $list,
        ]);
    }
}
