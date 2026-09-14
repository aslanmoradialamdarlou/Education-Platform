<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsQuestions {}

/**
 * @OA\Get(
 *   path="/v1/questions",
 *   tags={"Questions"},
 *   summary="Browse questions (public)",
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/questions/{question}",
 *   tags={"Questions"},
 *   summary="Question detail (public)",
 *   @OA\Parameter(name="question", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"),
 *   @OA\Response(response=404, description="Not found")
 * )
 *
 * @OA\Get(
 *   path="/v1/questions/{question}/preview",
 *   tags={"Questions"},
 *   summary="Preview question",
 *   @OA\Parameter(name="question", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK")
 * )
 */
