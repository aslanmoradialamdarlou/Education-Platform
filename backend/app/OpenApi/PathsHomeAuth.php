<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsHomeAuth {}

/**
 * HOME (optional auth)
 * @OA\Get(
 *   path="/v1/home",
 *   tags={"Home"},
 *   summary="Home feed (optional auth)",
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * AUTH
 * @OA\Post(path="/v1/auth/register-start", tags={"Auth"}, summary="Register (start)",
 *   @OA\RequestBody(@OA\JsonContent(
 *     @OA\Property(property="email", type="string", example="user@example.com")
 *   )),
 *   @OA\Response(response=200, description="OK")
 * )
 * @OA\Post(path="/v1/auth/register-complete", tags={"Auth"}, summary="Register (complete)",
 *   @OA\RequestBody(@OA\JsonContent(
 *     @OA\Property(property="email", type="string"),
 *     @OA\Property(property="otp", type="string", example="123456"),
 *     @OA\Property(property="password", type="string")
 *   )),
 *   @OA\Response(response=200, description="OK")
 * )
 * @OA\Post(path="/v1/auth/login-otp", tags={"Auth"}, summary="Login with OTP",
 *   @OA\RequestBody(@OA\JsonContent(
 *     @OA\Property(property="identifier", type="string", example="user@example.com"),
 *     @OA\Property(property="otp", type="string", example="123456")
 *   )),
 *   @OA\Response(response=200, description="OK")
 * )
 * @OA\Post(path="/v1/auth/login-password", tags={"Auth"}, summary="Login with password",
 *   @OA\RequestBody(@OA\JsonContent(
 *     @OA\Property(property="email", type="string"),
 *     @OA\Property(property="password", type="string")
 *   )),
 *   @OA\Response(response=200, description="OK")
 * )
 * @OA\Post(path="/v1/auth/logout", tags={"Auth"}, summary="Logout",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Response(response=200, description="OK")
 * )
 * @OA\Get(path="/v1/me", tags={"Auth"}, summary="Current user",
 *   security={{"SanctumBearer":{}}},
 *   @OA\Response(response=200, description="OK")
 * )
 */
