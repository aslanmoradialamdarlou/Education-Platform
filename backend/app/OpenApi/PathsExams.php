<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsExams {}

/**
 * Exams (auth)
 */

/**
 * @OA\Get(path="/v1/exams", tags={"Exams"}, summary="List exams",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/exams", tags={"Exams"}, summary="Create exam",
 *   security={{"SanctumBearer":{}}},
 *   @OA\RequestBody(@OA\JsonContent(@OA\Property(property="title", type="string", example="Midterm A"))),
 *   @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/exams/{exam}", tags={"Exams"}, summary="Get exam",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/v1/exams/{exam}", tags={"Exams"}, summary="Update exam",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(@OA\Property(property="title", type="string"))),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/exams/{exam}", tags={"Exams"}, summary="Delete exam",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 *
 * @OA\Get(path="/v1/exams/{exam}/questions", tags={"Exams"}, summary="Exam questions",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/exams/{exam}/items", tags={"Exams"}, summary="Add question to exam",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(@OA\Property(property="question_id", type="integer"))),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/exams/{exam}/questions", tags={"Exams"}, summary="Add bulk questions",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(@OA\Property(property="ids", type="array", @OA\Items(type="integer")))),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/exams/{exam}/items/{item}", tags={"Exams"}, summary="Remove question",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Parameter(name="item", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/v1/exams/{exam}/questions/reorder", tags={"Exams"}, summary="Reorder questions",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(@OA\Property(property="order", type="array", @OA\Items(type="integer")))),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/exams/{exam}/export", tags={"Exams"}, summary="Export exam PDF",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/exams/{exam}/answer-key", tags={"Exams"}, summary="Export answer key",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/v1/exams/{exam}/layout", tags={"Exams"}, summary="Update layout",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="exam", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent()),
 *   @OA\Response(response=200, description="OK"))
 */
