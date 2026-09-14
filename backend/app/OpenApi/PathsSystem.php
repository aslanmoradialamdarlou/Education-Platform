<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsSystem {}

/**
 * @OA\Get(
 *   path="/v1/health",
 *   tags={"System"},
 *   summary="API health (v1)",
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/version",
 *   tags={"System"},
 *   summary="API version",
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/health",
 *   tags={"System"},
 *   summary="Quick health (root)",
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/ping",
 *   tags={"System"},
 *   summary="Ping (root)",
 *   @OA\Response(response=200, description="OK")
 * )
 */
