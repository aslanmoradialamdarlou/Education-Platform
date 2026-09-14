<?php
namespace App\OpenApi;
use OpenApi\Annotations as OA;

/**
 * Auth + Profile
 */
final class PathsAuth {}

/** Register/Login (public) */

/**
 * @OA\Post(
 *   path="/v1/auth/register-start",
 *   tags={"Auth"},
 *   summary="Begin registration (send OTP)",
 *   @OA\RequestBody(
 *     required=true,
 *     @OA\JsonContent(
 *       required={"phone"},
 *       @OA\Property(property="phone", type="string", example="+15551234567")
 *     )
 *   ),
 *   @OA\Response(response=200, description="OTP sent or registration token issued")
 * )
 */

/**
 * @OA\Post(
 *   path="/v1/auth/register-complete",
 *   tags={"Auth"},
 *   summary="Complete registration (verify OTP, set password)",
 *   @OA\RequestBody(
 *     @OA\JsonContent(
 *       required={"phone","otp","password"},
 *       @OA\Property(property="phone", type="string"),
 *       @OA\Property(property="otp", type="string"),
 *       @OA\Property(property="password", type="string", format="password")
 *     )
 *   ),
 *   @OA\Response(response=201, description="User created, token issued")
 * )
 */

/**
 * @OA\Post(
 *   path="/v1/auth/login-otp",
 *   tags={"Auth"},
 *   summary="Login via OTP",
 *   @OA\RequestBody(
 *     @OA\JsonContent(
 *       required={"phone","otp"},
 *       @OA\Property(property="phone", type="string"),
 *       @OA\Property(property="otp", type="string")
 *     )
 *   ),
 *   @OA\Response(response=200, description="Returns bearer token")
 * )
 */

/**
 * @OA\Post(
 *   path="/v1/auth/login-password",
 *   tags={"Auth"},
 *   summary="Login with password",
 *   @OA\RequestBody(
 *     @OA\JsonContent(
 *       required={"email","password"},
 *       @OA\Property(property="email", type="string"),
 *       @OA\Property(property="password", type="string", format="password")
 *     )
 *   ),
 *   @OA\Response(response=200, description="Returns bearer token")
 * )
 */

/** Protected */

/**
 * @OA\Post(
 *   path="/v1/auth/logout",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Auth"},
 *   summary="Logout current token",
 *   @OA\Response(response=204, description="Logged out")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/me",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Auth"},
 *   summary="Get current user profile",
 *   @OA\Response(response=200, description="OK", @OA\JsonContent(ref="#/components/schemas/User"))
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/home",
 *   tags={"Auth"},
 *   summary="Home feed (optional auth)",
 *   @OA\Response(response=200, description="OK")
 * )
 */
