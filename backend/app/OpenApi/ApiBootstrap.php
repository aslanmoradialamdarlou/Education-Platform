<?php
namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * Root OpenAPI bootstrap (EXACTLY ONE @OA\Info in the whole project).
 *
 * @OA\Info(
 *   title="Edu Platform API",
 *   version="1.0.0",
 *   description="Public API and Admin CRUD for the Edu Platform."
 * )
 *
 * @OA\Server(
 *   url="/api",
 *   description="App-relative base (e.g., https://yourdomain.com/api)"
 * )
 *
 * @OA\SecurityScheme(
 *   securityScheme="SanctumBearer",
 *   type="http",
 *   scheme="bearer",
 *   bearerFormat="JWT",
 *   description="Use Laravel Sanctum-issued bearer token"
 * )
 *
 * @OA\Tag(name="System", description="Health & version")
 * @OA\Tag(name="Auth", description="Authentication & profile")
 * @OA\Tag(name="Home", description="Landing/home (optional auth)")
 * @OA\Tag(name="Catalog", description="Grades, books, chapters, contents")
 * @OA\Tag(name="Blog", description="Public blog")
 * @OA\Tag(name="Questions", description="Public questions")
 * @OA\Tag(name="Exams", description="Exam builder (auth)")
 * @OA\Tag(name="Licenses", description="Issue & manage licenses (auth)")
 * @OA\Tag(name="Orders", description="Orders & checkout (auth)")
 * @OA\Tag(name="Payments", description="Payment flows & callbacks")
 * @OA\Tag(name="Billing", description="Tokens & subscriptions (auth)")
 * @OA\Tag(name="Admin", description="Admin CRUD & tools")
 */
final class ApiBootstrap {}
