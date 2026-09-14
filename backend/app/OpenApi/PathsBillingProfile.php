<?php
namespace App\OpenApi;
use OpenApi\Annotations as OA;

/**
 * Billing & Profile tokens/subscriptions
 */
final class PathsBillingProfile {}

/**
 * @OA\Get(
 *   path="/v1/me/tokens",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Billing"},
 *   summary="List my tokens",
 *   @OA\Response(response=200, description="OK")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/me/subscriptions",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Billing"},
 *   summary="List my subscriptions",
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/Subscription")))
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/me/token-usage",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Billing"},
 *   summary="Token usage over time",
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/TokenUsage")))
 * )
 */
