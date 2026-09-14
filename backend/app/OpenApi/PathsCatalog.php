<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsCatalog {}

/**
 * Public catalog (read-only)
 * Routes (GradeApi/BookApi/ChapterApi/ContentApi)
 */

/**
 * @OA\Get(
 *   path="/v1/grades",
 *   tags={"Catalog"},
 *   summary="List grades",
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/grades/{grade}/books",
 *   tags={"Catalog"},
 *   summary="Books by grade",
 *   @OA\Parameter(name="grade", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/books/{book}/chapters",
 *   tags={"Catalog"},
 *   summary="Chapters by book",
 *   @OA\Parameter(name="book", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/chapters/{chapter}/subchapters",
 *   tags={"Catalog"},
 *   summary="Subchapters by chapter",
 *   @OA\Parameter(name="chapter", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/chapters/{chapter}/contents",
 *   tags={"Catalog"},
 *   summary="Contents by chapter",
 *   @OA\Parameter(name="chapter", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK")
 * )
 *
 * @OA\Get(
 *   path="/v1/subchapters/{subchapter}/contents",
 *   tags={"Catalog"},
 *   summary="Contents by subchapter",
 *   @OA\Parameter(name="subchapter", in="path", required=true, @OA\Schema(type="integer")),
 *   @OA\Response(response=200, description="OK")
 * )
 */
