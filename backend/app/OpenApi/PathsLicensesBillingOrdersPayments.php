<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsLicensesBillingOrdersPayments {}

/**
 * Licenses (auth)
 * Profile tokens/subscriptions (auth)
 * Orders/checkout/payments
 */

/** Licenses **/
/**
 * @OA\Get(path="/v1/licenses", tags={"Licenses"}, summary="List licenses",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/licenses/{license}", tags={"Licenses"}, summary="Show license",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="license", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/licenses/issue", tags={"Licenses"}, summary="Issue license",
 *   security={{"SanctumBearer":{}}}, @OA\RequestBody(@OA.JsonContent()), @OA\Response(response=201, description="Created"))
 * @OA\Post(path="/v1/licenses/{license}/retry", tags={"Licenses"}, summary="Retry license",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="license", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 */

/** Billing (profile) **/
/**
 * @OA\Get(path="/v1/me/tokens", tags={"Billing"}, summary="My tokens",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/me/subscriptions", tags={"Billing"}, summary="My subscriptions",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/me/token-usage", tags={"Billing"}, summary="My token usage",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Checkout + Orders (auth) **/
/**
 * @OA\Post(path="/v1/checkout", tags={"Orders"}, summary="Start checkout",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/orders", tags={"Orders"}, summary="List orders",
 *   security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/orders", tags={"Orders"}, summary="Create order",
 *   security={{"SanctumBearer":{}}}, @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/orders/{order}", tags={"Orders"}, summary="Show order",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="order", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/orders/{order}/pay", tags={"Orders"}, summary="Pay order",
 *   security={{"SanctumBearer":{}}}, @OA\Parameter(name="order", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK"))
 */

/** Payments (callbacks – mostly no auth) **/
/**
 * @OA\Get(path="/v1/payments/{driver}/callback", tags={"Payments"}, summary="Payment driver callback",
 *   @OA\Parameter(name="driver", in="path", required=true, @OA\Schema(type="string")), @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/payments/success", tags={"Payments"}, summary="Payment success page", @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/payments/failed", tags={"Payments"}, summary="Payment failed page", @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/payments/{order}/pay", tags={"Payments"}, summary="Pay link",
 *   @OA\Parameter(name="order", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK"))
 *
 * @OA\Get(path="/v1/payments/callback", tags={"Payments"}, summary="Generic callback", @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/payments/sandbox/callback", tags={"Payments"}, summary="Sandbox callback", @OA\Response(response=200, description="OK"))
 */
