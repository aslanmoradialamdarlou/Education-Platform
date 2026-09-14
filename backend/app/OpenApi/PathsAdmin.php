<?php
namespace App\OpenApi;
use OpenApi\Annotations as OA;

final class PathsAdmin {}

/**
 * @OA\Get(
 *   path="/v1/admin/questions/import-template",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Admin"},
 *   summary="Download question import template",
 *   @OA\Response(response=200, description="CSV/Excel")
 * )
 */

/**
 * @OA\Post(
 *   path="/v1/admin/questions/import",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Admin"},
 *   summary="Import questions (batch)",
 *   @OA\Response(response=202, description="Batch accepted")
 * )
 */

/**
 * @OA\Get(
 *   path="/v1/admin/questions",
 *   security={{"SanctumBearer":{}}},
 *   tags={"Admin"},
 *   summary="List questions (admin)",
 *   @OA\Response(response=200, description="OK")
 * )
 */

/* You can add more @OA annotations here mirroring your other admin resources:
   grades, subjects, books, chapters, subchapters, content-types, contents,
   users (suspend/activate), blog (categories, posts, publish/archive), plans,
   subscriptions, tokens.topup, video-licenses.store, imports.status/errors, etc.
 */
