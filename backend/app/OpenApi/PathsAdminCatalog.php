<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsAdminCatalog {}

/**
 * Grades / Subjects / Books / Chapters / Subchapters / Content Types / Contents (admin)
 * We declare a representative set for each apiResource.
 */

/** Grades **/
/**
 * @OA\Get(path="/v1/admin/grades", tags={"Admin"}, summary="List grades", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/grades", tags={"Admin"}, summary="Create grade", security={{"SanctumBearer":{}}}, @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/grades/{id}", tags={"Admin"}, summary="Show grade", security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/grades/{id}", tags={"Admin"}, summary="Update grade", security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/grades/{id}", tags={"Admin"}, summary="Delete grade", security={{"SanctumBearer":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK"))
 */

/** Subjects **/
/**
 * @OA\Get(path="/v1/admin/subjects", tags={"Admin"}, summary="List subjects", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/subjects", tags={"Admin"}, summary="Create subject", security={{"SanctumBearer":{}}}, @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/subjects/{id}", tags={"Admin"}, summary="Show subject", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/subjects/{id}", tags={"Admin"}, summary="Update subject", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/subjects/{id}", tags={"Admin"}, summary="Delete subject", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Books (already detailed in your controller; still include here for coverage) **/
/**
 * @OA\Get(path="/v1/admin/books", tags={"Admin"}, summary="List books", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/books", tags={"Admin"}, summary="Create book", security={{"SanctumBearer":{}}}, @OA\RequestBody(@OA\JsonContent()), @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/books/{id}", tags={"Admin"}, summary="Show book", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/books/{id}", tags={"Admin"}, summary="Update book", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/books/{id}", tags={"Admin"}, summary="Delete book", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Chapters **/
/**
 * @OA\Get(path="/v1/admin/chapters", tags={"Admin"}, summary="List chapters", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/chapters", tags={"Admin"}, summary="Create chapter", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/chapters/{id}", tags={"Admin"}, summary="Show chapter", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/chapters/{id}", tags={"Admin"}, summary="Update chapter", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/chapters/{id}", tags={"Admin"}, summary="Delete chapter", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Subchapters **/
/**
 * @OA\Get(path="/v1/admin/subchapters", tags={"Admin"}, summary="List subchapters", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/subchapters", tags={"Admin"}, summary="Create subchapter", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/subchapters/{id}", tags={"Admin"}, summary="Show subchapter", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/subchapters/{id}", tags={"Admin"}, summary="Update subchapter", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/subchapters/{id}", tags={"Admin"}, summary="Delete subchapter", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Content Types **/
/**
 * @OA\Get(path="/v1/admin/content-types", tags={"Admin"}, summary="List content types", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/content-types", tags={"Admin"}, summary="Create content type", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/content-types/{id}", tags={"Admin"}, summary="Show content type", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/content-types/{id}", tags={"Admin"}, summary="Update content type", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/content-types/{id}", tags={"Admin"}, summary="Delete content type", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Contents **/
/**
 * @OA\Get(path="/v1/admin/contents", tags={"Admin"}, summary="List contents", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/contents", tags={"Admin"}, summary="Create content", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/contents/{id}", tags={"Admin"}, summary="Show content", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/contents/{id}", tags={"Admin"}, summary="Update content", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/contents/{id}", tags={"Admin"}, summary="Delete content", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */
