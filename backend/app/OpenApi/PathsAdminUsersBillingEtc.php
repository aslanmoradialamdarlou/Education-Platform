<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

final class PathsAdminUsersBillingEtc {}

/** Users **/
/**
 * @OA\Get(path="/v1/admin/users", tags={"Admin"}, summary="List users", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/users", tags={"Admin"}, summary="Create user", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/users/{user}", tags={"Admin"}, summary="Show user", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/users/{user}", tags={"Admin"}, summary="Update user", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/users/{user}", tags={"Admin"}, summary="Delete user", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/v1/admin/users/{user}/suspend", tags={"Admin"}, summary="Suspend user", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Patch(path="/v1/admin/users/{user}/activate", tags={"Admin"}, summary="Activate user", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Plans **/
/**
 * @OA\Get(path="/v1/admin/plans", tags={"Admin"}, summary="List plans", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/plans", tags={"Admin"}, summary="Create plan", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/plans/{id}", tags={"Admin"}, summary="Show plan", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/plans/{id}", tags={"Admin"}, summary="Update plan", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/plans/{id}", tags={"Admin"}, summary="Delete plan", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Subscriptions (admin) **/
/**
 * @OA\Get(path="/v1/admin/subscriptions", tags={"Admin"}, summary="List subscriptions", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/subscriptions", tags={"Admin"}, summary="Create subscription", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/subscriptions/{id}", tags={"Admin"}, summary="Show subscription", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/subscriptions/{id}", tags={"Admin"}, summary="Update subscription", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/subscriptions/{id}", tags={"Admin"}, summary="Delete subscription", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Tokens (admin) **/
/**
 * @OA\Post(path="/v1/admin/tokens/topup", tags={"Admin"}, summary="Top-up tokens for user", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Video Licenses (admin) **/
/**
 * @OA\Post(path="/v1/admin/video-licenses", tags={"Admin"}, summary="Create video license", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 */

/** Billing (admin, me/* reports) **/
/**
 * @OA\Get(path="/v1/admin/me/tokens", tags={"Admin"}, summary="Admin: tokens report (self)", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/admin/me/subscriptions", tags={"Admin"}, summary="Admin: subscriptions report (self)", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/admin/me/token-usages", tags={"Admin"}, summary="Admin: token usages (self)", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Exam Header Templates **/
/**
 * @OA\Get(path="/v1/admin/exam-header-templates", tags={"Admin"}, summary="List exam header templates", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/exam-header-templates", tags={"Admin"}, summary="Create header template", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/exam-header-templates/{id}", tags={"Admin"}, summary="Show header template", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/exam-header-templates/{id}", tags={"Admin"}, summary="Update header template", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/exam-header-templates/{id}", tags={"Admin"}, summary="Delete header template", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Question imports & helpers **/
/**
 * @OA\Get(path="/v1/admin/questions/import-template", tags={"Admin"}, summary="Download import template", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/questions/import", tags={"Admin"}, summary="Import questions", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/admin/questions/import/{batch}", tags={"Admin"}, summary="Import status (legacy)", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/question-imports", tags={"Admin"}, summary="Create import batch", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/question-imports/{import}", tags={"Admin"}, summary="Show import batch", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/admin/imports/{batch}", tags={"Admin"}, summary="Show import (alias)", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Get(path="/v1/admin/imports/{batch}/errors", tags={"Admin"}, summary="Import errors", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */

/** Questions (admin CRUD + actions) **/
/**
 * @OA\Get(path="/v1/admin/questions", tags={"Admin"}, summary="List questions", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/questions", tags={"Admin"}, summary="Create question", security={{"SanctumBearer":{}}}, @OA\Response(response=201, description="Created"))
 * @OA\Get(path="/v1/admin/questions/{question}", tags={"Admin"}, summary="Show question", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Put(path="/v1/admin/questions/{question}", tags={"Admin"}, summary="Update question", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Delete(path="/v1/admin/questions/{question}", tags={"Admin"}, summary="Delete question", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/questions/{question}/publish", tags={"Admin"}, summary="Publish question", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/questions/{question}/archive", tags={"Admin"}, summary="Archive question", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 * @OA\Post(path="/v1/admin/questions/{question}/assets", tags={"Admin"}, summary="Upload question asset", security={{"SanctumBearer":{}}}, @OA\Response(response=200, description="OK"))
 */
