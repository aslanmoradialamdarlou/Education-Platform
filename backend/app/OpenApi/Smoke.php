<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * Simple smoke test.
 */

/**
 * @OA\Get(
 *   path="/v1/health",
 *   tags={"System"},
 *   summary="Health (smoke)",
 *   @OA\Response(response=200, description="OK")
 * )
 */
final class Smoke {}
