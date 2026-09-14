<?php
namespace App\OpenApi;
use OpenApi\Annotations as OA;

final class PathsOrdersPayments {}

/** Orders (auth) */

/**
 * @OA\Get(
 *   path="/v1/orders",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Orders"},
 *   summary="List my orders",
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/Order")))
 * )
 */

/**
 * @OA\Post(
 *   path="/v1/orders",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Orders"},
 *   summary="Create an order",
 *   @OA\RequestBody(@OA\JsonContent(
 *     required={"items"},
 *     @OA\Property(property="items", type="array", @OA\Items(type="object",
 *       @OA\Property(property="sku", type="string"),
 *       @OA\Property(property="qty", type="integer")))
 *   )),
 *   @OA\Response(response=201, description="Created", @OA\JsonContent(ref="#/components/schemas/Order"))
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/orders/{order}",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Orders"},
 *   summary="Show an order",
 *   @OA\Parameter(name="order", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/Order"))
 * )
 */

/** Checkout (auth) */

/**
 * @OA\Post(
 *   path="/v1/checkout",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Orders"},
 *   summary="Checkout current cart/order",
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/PaymentRedirect"))
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/orders/{order}/pay",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Payments"},
 *   summary="Start payment for an order",
 *   @OA\Parameter(name="order", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/PaymentRedirect"))
 * )
 */

/** Payment callbacks (public) */

/**
 * @OA\Get(
 *   path="/v1/payments/{driver}/callback",
 *   tags={"Payments"},
 *   summary="Gateway callback (driver route)",
 *   @OA\Parameter(name="driver", in="path", required=true, @OA\Schema(type="string")),
 *   @OA\Response(response=200, description="OK")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/payments/callback",
 *   tags={"Payments"},
 *   summary="Generic callback",
 *   @OA\Response(response=200, description="OK")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/payments/sandbox/callback",
 *   tags={"Payments"},
 *   summary="Sandbox callback",
 *   @OA\Response(response=200, description="OK")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/payments/success",
 *   tags={"Payments"},
 *   summary="Success landing",
 *   @OA\Response(response=200, description="OK")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/payments/failed",
 *   tags={"Payments"},
 *   summary="Failed landing",
 *   @OA\Response(response=200, description="OK")
 * )
 */
