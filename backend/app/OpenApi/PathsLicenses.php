<?php
namespace App\OpenApi;
use OpenApi\Annotations as OA;

final class PathsLicenses {}

/**
 * @OA\Get(
 *   path="/v1/licenses",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Licenses"},
 *   summary="List licenses",
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/License")))
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/licenses/{license}",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Licenses"},
 *   summary="Show license",
 *   @OA\Parameter(name="license", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/License"))
 * )
 */

/**
 * @OA\Post(
 *   path="/v1/licenses/issue",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Licenses"},
 *   summary="Issue a license",
 *   @OA\RequestBody(@OA\JsonContent(
 *     required={"productId"},
 *     @OA\Property(property="productId", type="integer")
 *   )),
 *   @OA\Response(response=201, description="Issued", @OA\JsonContent(ref="#/components/schemas/License"))
 * )
 */

/**
 * @OA\Post(
 *   path="/v1/licenses/{license}/retry",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Licenses"},
 *   summary="Retry license issuance",
 *   @OA\Parameter(name="license", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK")
 * )
 */
