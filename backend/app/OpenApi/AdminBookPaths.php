<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * Admin — Books
 * Route prefix: /api/v1/admin/books
 */
final class AdminBookPaths {}

/**
 * ===== Schemas =====
 */

/**
 * @OA\Schema(
 *   schema="AdminBook",
 *   type="object",
 *   required={"id","title","year","grade","subject","chapters_cnt"},
 *   @OA\Property(property="id", type="integer", example=45),
 *   @OA\Property(property="title", type="string", example="Mathematics 7"),
 *   @OA\Property(property="year", type="integer", example=1403),
 *   @OA\Property(property="grade", type="object",
 *     @OA\Property(property="id", type="integer", example=7),
 *     @OA\Property(property="name", type="string", example="Grade 7")
 *   ),
 *   @OA\Property(property="subject", type="object",
 *     @OA\Property(property="id", type="integer", example=3),
 *     @OA\Property(property="name", type="string", example="Math")
 *   ),
 *   @OA\Property(property="chapters_cnt", type="integer", example=12)
 * )
 *
 * @OA\Schema(
 *   schema="AdminBookCreate",
 *   type="object",
 *   required={"subject_id","grade_id","title","year"},
 *   @OA\Property(property="subject_id", type="integer", example=3),
 *   @OA\Property(property="grade_id", type="integer", example=7),
 *   @OA\Property(property="title", type="string", example="Mathematics 7"),
 *   @OA\Property(property="year", type="integer", example=1403)
 * )
 *
 * @OA\Schema(
 *   schema="AdminBookUpdate",
 *   type="object",
 *   @OA\Property(property="subject_id", type="integer", example=3),
 *   @OA\Property(property="grade_id", type="integer", example=7),
 *   @OA\Property(property="title", type="string", example="Math 7 - Rev A"),
 *   @OA\Property(property="year", type="integer", example=1404)
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeBookSingle",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Book detail"),
 *   @OA\Property(property="data", ref="#/components/schemas/AdminBook")
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeBookList",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Books list"),
 *   @OA\Property(
 *     property="data",
 *     type="array",
 *     @OA\Items(ref="#/components/schemas/AdminBook")
 *   ),
 *   @OA\Property(property="meta", ref="#/components/schemas/StdMeta")
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeBookIdOnly",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Book created"),
 *   @OA\Property(property="data", type="object",
 *     @OA\Property(property="id", type="integer", example=45)
 *   )
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/admin/books",
 *   tags={"Admin"},
 *   summary="List books",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="q", in="query", @OA\Schema(type="string")),
 *   @OA\Parameter(name="grade_id", in="query", @OA\Schema(type="integer")),
 *   @OA\Parameter(name="subject_id", in="query", @OA\Schema(type="integer")),
 *   @OA\Parameter(name="year", in="query", @OA\Schema(type="integer")),
 *   @OA\Parameter(name="per", in="query", @OA\Schema(type="integer", minimum=1, maximum=200, default=20)),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeBookList"))
 * )
 *
 * @OA\Post(
 *   path="/v1/admin/books",
 *   tags={"Admin"},
 *   summary="Create book",
 *   security={{"SanctumBearer":{}}},
 *   @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/AdminBookCreate")),
 *   @OA\Response(response=201, description="Created", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeBookIdOnly")),
 *   @OA\Response(response=422, description="Validation error")
 * )
 *
 * @OA\Get(
 *   path="/v1/admin/books/{id}",
 *   tags={"Admin"},
 *   summary="Get book detail",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeBookSingle")),
 *   @OA\Response(response=404, description="Not Found")
 * )
 *
 * @OA\Put(
 *   path="/v1/admin/books/{id}",
 *   tags={"Admin"},
 *   summary="Update book",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(ref="#/components/schemas/AdminBookUpdate")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeBookIdOnly"))
 * )
 *
 * @OA\Patch(
 *   path="/v1/admin/books/{id}",
 *   tags={"Admin"},
 *   summary="Partial update book",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(ref="#/components/schemas/AdminBookUpdate")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeBookIdOnly"))
 * )
 *
 * @OA\Delete(
 *   path="/v1/admin/books/{id}",
 *   tags={"Admin"},
 *   summary="Delete book",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(
 *     type="object",
 *     @OA\Property(property="code", type="string", example="OK"),
 *     @OA\Property(property="message", type="string", example="Book deleted"),
 *     @OA\Property(property="data", type="null", nullable=true, example=null)
 *   )),
 *   @OA\Response(response=409, description="Conflict (has chapters)")
 * )
 */
