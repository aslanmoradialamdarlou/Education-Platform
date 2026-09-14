<?php
namespace App\OpenApi;
use OpenApi\Annotations as OA;

/** @OA\Info(title="Edu Platform API", version="1.0.0") */

/**
 * @OA\Get(
 *   path="/ping",
 *   tags={"System"},
 *   summary="Ping",
 *   @OA\Response(response=200, description="OK")
 * )
 */
final class Sanity {}
