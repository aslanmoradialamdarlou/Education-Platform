<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * Admin — Blog Uploads
 * Route: POST /api/v1/admin/blog/uploads
 */
final class AdminBlogUploadPaths {}

/**
 * @OA\Schema(
 *   schema="AdminUploadResult",
 *   type="object",
 *   @OA\Property(property="url", type="string", example="https://your.app/storage/blog/abc.webp"),
 *   @OA\Property(property="path", type="string", example="blog/abc.webp")
 * )
 *
 * @OA\Post(
 *   path="/v1/admin/blog/uploads",
 *   tags={"Admin"},
 *   summary="Upload blog image",
 *   security={{"SanctumBearer":{}}},
 *   @OA\RequestBody(required=true,
 *     @OA\MediaType(
 *       mediaType="multipart/form-data",
 *       @OA\Schema(
 *         type="object",
 *         required={"file"},
 *         @OA\Property(
 *           property="file",
 *           type="string",
 *           format="binary",
 *           description="jpg,jpeg,png,webp up to 4MB"
 *         )
 *       )
 *     )
 *   ),
 *   @OA\Response(response=201, description="Created",
 *     @OA\JsonContent(type="object",
 *       @OA\Property(property="code", type="string", example="OK"),
 *       @OA\Property(property="message", type="string", example="Uploaded"),
 *       @OA\Property(property="data", ref="#/components/schemas/AdminUploadResult")
 *     )
 *   ),
 *   @OA\Response(response=422, description="Validation error")
 * )
 */
