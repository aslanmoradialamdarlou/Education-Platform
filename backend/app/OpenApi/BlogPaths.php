<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class BlogPaths {}

/**
 * @OA\Get(
 *   path="/v1/blog-posts",
 *   tags={"Blog"},
 *   summary="List blog posts (public)",
 *   @OA\Parameter(name="page", in="query", @OA\Schema(type="integer", minimum=1, default=1)),
 *   @OA\Parameter(name="pageSize", in="query", @OA\Schema(type="integer", minimum=1, maximum=50, default=10)),
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/blog-posts/{slugOrId}",
 *   tags={"Blog"},
 *   summary="Get a blog post (public)",
 *   @OA\Parameter(name="slugOrId", in="path", required=true, @OA\Schema(type="string")),
 *   @OA\Response(response=200, description="OK"),
 *   @OA\Response(response=404, description="Not found")
 * )
 */
