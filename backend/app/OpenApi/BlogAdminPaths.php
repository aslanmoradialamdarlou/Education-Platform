<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class BlogAdminPaths {}

/**
 * Blog Categories (admin; Sanctum)
 */

/**
 * @OA\Get(path="/v1/admin/blog-categories", tags={"Admin"}, summary="List categories",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="q", in="query", @OA\Schema(type="string")),
 *   @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", default=20)),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/blog-categories", tags={"Admin"}, summary="Create category",
 *   security={{"SanctumBearer":{}}}, @OA\RequestBody(@OA\JsonContent(
 *     required={"name"}, @OA\Property(property="name", type="string"),
 *     @OA\Property(property="slug", type="string", nullable=true), @OA\Property(property="description", type="string", nullable=true)
 *   )), @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/blog-categories/{id}", tags={"Admin"}, summary="Show category",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/blog-categories/{id}", tags={"Admin"}, summary="Update category",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/v1/admin/blog-categories/{id}", tags={"Admin"}, summary="Partial update category",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/blog-categories/{id}", tags={"Admin"}, summary="Delete category",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"), @OA\Response(response=409, description="Conflict"))
 */

/**
 * Blog Posts (admin)
 */
/**
 * @OA\Get(path="/v1/admin/blog-posts", tags={"Admin"}, summary="List posts",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/blog-posts", tags={"Admin"}, summary="Create post",
 *   security={{"SanctumBearer":{}}}, @OA\RequestBody(@OA\JsonContent(
 *     required={"title","content","status"},
 *     @OA\Property(property="title", type="string"), @OA\Property(property="content", type="string"),
 *     @OA\Property(property="status", type="string", enum={"draft","published","archived"})
 *   )), @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/blog-posts/{id}", tags={"Admin"}, summary="Show post",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/blog-posts/{id}", tags={"Admin"}, summary="Update post",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/v1/admin/blog-posts/{id}", tags={"Admin"}, summary="Partial update post",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/blog-posts/{id}", tags={"Admin"}, summary="Delete post",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/blog-posts/{id}/publish", tags={"Admin"}, summary="Publish post",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/blog-posts/{id}/archive", tags={"Admin"}, summary="Archive post",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 *
 * @OA\Get(path="/v1/admin/blog-slug/check", tags={"Admin"}, summary="Check slug availability",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="slug", in="query", required=true, @OA\Schema(type="string")),
 *   @OA\Parameter(name="ignore_id", in="query", @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 *
 * @OA\Post(path="/v1/admin/blog/uploads", tags={"Admin"}, summary="Upload blog image",
 *   security={{"SanctumBearer":{}}}, @OA\RequestBody(
 *     required=true,
 *     @OA\MediaType(mediaType="multipart/form-data", @OA\Schema(
 *       required={"file"},
 *       @OA\Property(property="file", type="string", format="binary",
 *         description="jpg,jpeg,png,webp up to 4MB")
 *     ))
 *   ),
 *   @OA\Response(response=201, description="Uploaded"))
 */
