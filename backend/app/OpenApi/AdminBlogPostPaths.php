<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * Admin — Blog Posts
 * Route prefix: /api/v1/admin/blog-posts
 */
final class AdminBlogPostPaths {}

/**
 * ===== Schemas =====
 */

/**
 * @OA\Schema(
 *   schema="AdminBlogPost",
 *   type="object",
 *   required={"id","title","slug","status"},
 *   @OA\Property(property="id", type="integer", example=101),
 *   @OA\Property(property="title", type="string", example="How to learn fractions"),
 *   @OA\Property(property="slug", type="string", example="learn-fractions"),
 *   @OA\Property(property="content", type="string", example="# Markdown body ..."),
 *   @OA\Property(property="excerpt", type="string", nullable=true),
 *   @OA\Property(property="cover_image_url", type="string", nullable=true, example="https://.../cover.jpg"),
 *   @OA\Property(property="is_pinned", type="boolean", example=false),
 *   @OA\Property(property="status", type="string", example="draft"),
 *   @OA\Property(property="published_at", type="string", nullable=true, example="2025-10-07 10:00:00"),
 *   @OA\Property(property="reading_time", type="integer", example=4),
 *   @OA\Property(
 *     property="author",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Admin")
 *   ),
 *   @OA\Property(
 *     property="categories",
 *     type="array",
 *     @OA\Items(type="object",
 *       @OA\Property(property="id", type="integer", example=12),
 *       @OA\Property(property="name", type="string", example="Tutorials")
 *     )
 *   ),
 *   @OA\Property(property="comments_count", type="integer", example=0),
 *   @OA\Property(property="likes_count", type="integer", example=3)
 * )
 *
 * @OA\Schema(
 *   schema="AdminBlogPostCreate",
 *   type="object",
 *   required={"title","content","status"},
 *   @OA\Property(property="title", type="string"),
 *   @OA\Property(property="slug", type="string", nullable=true),
 *   @OA\Property(property="content", type="string"),
 *   @OA\Property(property="excerpt", type="string", nullable=true),
 *   @OA\Property(property="cover_image_url", type="string", nullable=true),
 *   @OA\Property(property="meta_title", type="string", nullable=true),
 *   @OA\Property(property="meta_description", type="string", nullable=true),
 *   @OA\Property(property="meta_keywords", type="string", nullable=true),
 *   @OA\Property(property="canonical_url", type="string", nullable=true),
 *   @OA\Property(property="is_pinned", type="boolean", default=false),
 *   @OA\Property(property="status", type="string", enum={"draft","published","archived"}),
 *   @OA\Property(property="published_at", type="string", nullable=true),
 *   @OA\Property(property="category_ids", type="array", @OA\Items(type="integer"))
 * )
 *
 * @OA\Schema(
 *   schema="AdminBlogPostUpdate",
 *   type="object",
 *   @OA\Property(property="title", type="string"),
 *   @OA\Property(property="slug", type="string", nullable=true),
 *   @OA\Property(property="content", type="string"),
 *   @OA\Property(property="excerpt", type="string", nullable=true),
 *   @OA\Property(property="cover_image_url", type="string", nullable=true),
 *   @OA\Property(property="meta_title", type="string", nullable=true),
 *   @OA\Property(property="meta_description", type="string", nullable=true),
 *   @OA\Property(property="meta_keywords", type="string", nullable=true),
 *   @OA\Property(property="canonical_url", type="string", nullable=true),
 *   @OA\Property(property="is_pinned", type="boolean"),
 *   @OA\Property(property="status", type="string", enum={"draft","published","archived"}),
 *   @OA\Property(property="published_at", type="string", nullable=true),
 *   @OA\Property(property="category_ids", type="array", @OA\Items(type="integer"))
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopePostSingle",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Blog post detail"),
 *   @OA\Property(property="data", ref="#/components/schemas/AdminBlogPost")
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopePostList",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Posts list"),
 *   @OA\Property(
 *     property="data",
 *     type="array",
 *     @OA\Items(ref="#/components/schemas/AdminBlogPost")
 *   ),
 *   @OA\Property(property="meta", ref="#/components/schemas/StdMeta")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/admin/blog-posts",
 *   tags={"Admin"},
 *   summary="List posts (filters + pagination)",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="q", in="query", @OA\Schema(type="string")),
 *   @OA\Parameter(name="status", in="query", @OA\Schema(type="string", enum={"draft","published","archived"})),
 *   @OA\Parameter(name="author_id", in="query", @OA\Schema(type="integer")),
 *   @OA\Parameter(name="category_id", in="query", @OA\Schema(type="integer")),
 *   @OA\Parameter(name="pinned", in="query", @OA\Schema(type="boolean")),
 *   @OA\Parameter(name="date_from", in="query", @OA\Schema(type="string", format="date")),
 *   @OA\Parameter(name="date_to", in="query", @OA\Schema(type="string", format="date")),
 *   @OA\Parameter(name="sort", in="query", @OA\Schema(type="string", example="-id")),
 *   @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", minimum=1, maximum=200, default=20)),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopePostList"))
 * )
 *
 * @OA\Post(
 *   path="/v1/admin/blog-posts",
 *   tags={"Admin"},
 *   summary="Create post",
 *   security={{"SanctumBearer":{}}},
 *   @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/AdminBlogPostCreate")),
 *   @OA\Response(response=201, description="Created", @OA\JsonContent(ref="#/components/schemas/StdEnvelopePostSingle"))
 * )
 *
 * @OA\Get(
 *   path="/v1/admin/blog-posts/{id}",
 *   tags={"Admin"},
 *   summary="Get post detail",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopePostSingle")),
 *   @OA\Response(response=404, description="Not Found")
 * )
 *
 * @OA\Put(
 *   path="/v1/admin/blog-posts/{id}",
 *   tags={"Admin"},
 *   summary="Update post",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(ref="#/components/schemas/AdminBlogPostUpdate")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopePostSingle"))
 * )
 *
 * @OA\Patch(
 *   path="/v1/admin/blog-posts/{id}",
 *   tags={"Admin"},
 *   summary="Partial update post",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\RequestBody(@OA\JsonContent(ref="#/components/schemas/AdminBlogPostUpdate")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopePostSingle"))
 * )
 *
 * @OA\Delete(
 *   path="/v1/admin/blog-posts/{id}",
 *   tags={"Admin"},
 *   summary="Delete post",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(
 *     type="object",
 *     @OA\Property(property="code", type="string", example="OK"),
 *     @OA\Property(property="message", type="string", example="Blog post deleted"),
 *     @OA\Property(property="data", type="null", nullable=true, example=null)
 *   ))
 * )
 *
 * @OA\Post(
 *   path="/v1/admin/blog-posts/{id}/publish",
 *   tags={"Admin"},
 *   summary="Publish post",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopePostSingle"))
 * )
 *
 * @OA\Post(
 *   path="/v1/admin/blog-posts/{id}/archive",
 *   tags={"Admin"},
 *   summary="Archive post",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/StdEnvelopePostSingle"))
 * )
 *
 * @OA\Get(
 *   path="/v1/admin/blog-slug/check",
 *   tags={"Admin"},
 *   summary="Check slug availability",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Parameter(name="slug", in="query", required=true, @OA\Schema(type="string")),
 *   @OA\Parameter(name="ignore_id", in="query", required=false, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK",
 *     @OA\JsonContent(type="object",
 *       @OA\Property(property="code", type="string", example="OK"),
 *       @OA\Property(property="message", type="string", example="Slug checked"),
 *       @OA\Property(property="data", type="object",
 *         @OA\Property(property="available", type="boolean", example=true),
 *         @OA\Property(property="suggestion", type="string", example="learn-fractions-2")
 *       )
 *     )
 *   )
 * )
 */
