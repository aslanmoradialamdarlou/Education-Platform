<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * Admin — Blog Categories
 * Route prefix: /api/v1/admin/blog-categories
 */
final class AdminBlogCategoryPaths {}

/**
 * ===== Schemas =====
 */

/**
 * @OA\Schema(
 *   schema="AdminBlogCategory",
 *   type="object",
 *   required={"id","name","slug","posts_count"},
 *   @OA\Property(property="id", type="integer", example=12),
 *   @OA\Property(property="name", type="string", example="Tutorials"),
 *   @OA\Property(property="slug", type="string", example="tutorials"),
 *   @OA\Property(property="description", type="string", nullable=true, example="How-to articles"),
 *   @OA\Property(property="posts_count", type="integer", example=5),
 * )
 *
 * @OA\Schema(
 *   schema="AdminBlogCategoryCreate",
 *   type="object",
 *   required={"name"},
 *   @OA\Property(property="name", type="string", example="Tutorials"),
 *   @OA\Property(property="slug", type="string", nullable=true, example="tutorials"),
 *   @OA\Property(property="description", type="string", nullable=true, example="How-to articles"),
 * )
 *
 * @OA\Schema(
 *   schema="AdminBlogCategoryUpdate",
 *   type="object",
 *   @OA\Property(property="name", type="string", example="Guides"),
 *   @OA\Property(property="slug", type="string", nullable=true, example="guides"),
 *   @OA\Property(property="description", type="string", nullable=true, example="Updated description"),
 * )
 *
 * @OA\Schema(
 *   schema="StdMeta",
 *   type="object",
 *   @OA\Property(property="current_page", type="integer", example=1),
 *   @OA\Property(property="per_page", type="integer", example=20),
 *   @OA\Property(property="total", type="integer", example=35)
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeCategorySingle",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Category detail"),
 *   @OA\Property(property="data", ref="#/components/schemas/AdminBlogCategory")
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeCategoryList",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Categories list"),
 *   @OA\Property(
 *     property="data",
 *     type="array",
 *     @OA\Items(ref="#/components/schemas/AdminBlogCategory")
 *   ),
 *   @OA\Property(property="meta", ref="#/components/schemas/StdMeta")
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeEmpty",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Category deleted"),
 *   @OA\Property(property="data", type="null", nullable=true, example=null)
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/admin/blog-categories",
 *   tags={"Admin"},
 *   summary="List blog categories",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="q", in="query", description="Search name/slug", @OA\Schema(type="string")),
 *   @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", minimum=1, maximum=200, default=20)),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeCategoryList"))
 * )
 *
 * @OA\Post(
 *   path="/v1/admin/blog-categories",
 *   tags={"Admin"},
 *   summary="Create category",
 *   security={{"SanctumBearer":{}}},
 *   @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/AdminBlogCategoryCreate")),
 *   @OA\Response(response=201, description="Created", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeCategorySingle"))
 * )
 *
 * @OA\Get(
 *   path="/v1/admin/blog-categories/{id}",
 *   tags={"Admin"},
 *   summary="Get category detail",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeCategorySingle")),
 *   @OA\Response(response=404, description="Not Found")
 * )
 *
 * @OA\Put(
 *   path="/v1/admin/blog-categories/{id}",
 *   tags={"Admin"},
 *   summary="Update category",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(ref="#/components/schemas/AdminBlogCategoryUpdate")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeCategorySingle"))
 * )
 *
 * @OA\Patch(
 *   path="/v1/admin/blog-categories/{id}",
 *   tags={"Admin"},
 *   summary="Partial update category",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(ref="#/components/schemas/AdminBlogCategoryUpdate")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeCategorySingle"))
 * )
 *
 * @OA\Delete(
 *   path="/v1/admin/blog-categories/{id}",
 *   tags={"Admin"},
 *   summary="Delete category",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopeEmpty")),
 *   @OA\Response(response=409, description="Conflict (has posts)")
 * )
 */
