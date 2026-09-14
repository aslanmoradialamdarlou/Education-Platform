<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * Shared, compact schemas (envelope/meta/error/id-only).
 */

/**
 * @OA\Schema(
 *   schema="StdMeta",
 *   type="object",
 *   @OA\Property(property="current_page", type="integer", example=1),
 *   @OA\Property(property="per_page", type="integer", example=20),
 *   @OA\Property(property="total", type="integer", example=220)
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeEmpty",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Success"),
 *   @OA\Property(property="data", type="null", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *   schema="StdEnvelopeIdOnly",
 *   type="object",
 *   @OA\Property(property="code", type="string", example="OK"),
 *   @OA\Property(property="message", type="string", example="Created"),
 *   @OA\Property(property="data", type="object",
 *     @OA\Property(property="id", type="integer", example=123)
 *   )
 * )
 *
 * @OA\Schema(
 *   schema="StdError",
 *   type="object",
 *   @OA\Property(property="message", type="string", example="The given data was invalid."),
 *   @OA\Property(property="errors", type="object",
 *     additionalProperties=@OA\Schema(type="array", @OA\Items(type="string"))
 *   )
 * )
 */
final class Schemas {}
