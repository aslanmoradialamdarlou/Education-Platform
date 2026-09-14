<?php
return [

    // Global info (shows at the top of the page)
    'info' => [
        'title'       => env('APP_NAME', 'API') . ' — API Reference',
        'description' => 'Public and Admin endpoints with short explanations, auth notes, and examples. ' .
            'Auto-synced with your routes, descriptions live here.',
        'version'     => 'v1',
        'base_url'    => env('APP_URL') . '/api',
        'auth_note'   => 'Endpoints with the Sanctum badge require Bearer token (Authorization: Bearer <token>).',
    ],

    // Per-route metadata keyed by route *name* (preferred) or by URI fallback.
    // Fill what you need; anything missing still appears with auto info.
    'endpoints' => [

        // -------- System --------
        'api.v1.health' => [
            'title'       => 'Health Check',
            'summary'     => 'Liveness probe for the API.',
            'description' => 'Returns a simple JSON to indicate the API is up.',
            'params'      => [],
            'request'     => null,
            'response'    => [
                'status' => 200,
                'body'   => ['ok' => true, 'time' => '2025-10-09T10:00:00Z'],
            ],
            'notes'       => 'No auth required.',
            'tags'        => ['system'],
        ],

        // -------- Auth --------
        'api.v1.auth.login-otp' => [
            'title'       => 'Login with OTP',
            'summary'     => 'Issues a login OTP and verifies it.',
            'description' => 'Post user identifier (e.g. phone or email) and OTP code to obtain a session/token.',
            'params'      => [],
            'request'     => [
                'method' => 'POST',
                'body'   => [
                    'identifier' => 'user@example.com',
                    'otp'        => '123456'
                ],
            ],
            'response'    => [
                'status' => 200,
                'body'   => [
                    'token' => 'xxxxx',
                    'user'  => ['id' => 1, 'name' => 'Mehdi']
                ],
            ],
            'notes'       => 'No token required for the call itself. You’ll receive a Sanctum token.',
            'tags'        => ['auth'],
        ],

        // -------- Exams (auth) --------
        'api.v1.exams.index' => [
            'title'       => 'List Exams',
            'summary'     => 'Get paginated exams for the authenticated user.',
            'description' => 'Supports typical pagination with page & per_page.',
            'params'      => [
                ['name' => 'page', 'in' => 'query', 'type' => 'integer', 'required' => false, 'example' => 1],
                ['name' => 'per_page', 'in' => 'query', 'type' => 'integer', 'required' => false, 'example' => 20],
            ],
            'request'     => [
                'headers' => ['Authorization' => 'Bearer {token}']
            ],
            'response'    => [
                'status' => 200,
                'body'   => [
                    'data' => [
                        ['id' => 10, 'title' => 'Midterm A', 'questions_count' => 30]
                    ],
                    'meta' => ['page' => 1, 'per_page' => 20, 'total' => 1]
                ],
            ],
            'notes'       => 'Requires Sanctum token.',
            'tags'        => ['exams'],
        ],

        // Add more (copy/paste and change keys to your route names):
        // - api.v1.grades.index
        // - api.v1.chapters.subchapters
        // - api.v1.questions.index
        // - api.v1.admin.questions.index
        // - api.v1.payments.callback
        // etc.
    ],

    // Grouping order (by route name prefix or tag)
    'groups' => [
        'system'  => 'System',
        'auth'    => 'Authentication',
        'catalog' => 'Catalog (Grades/Books/Chapters/Contents)',
        'blog'    => 'Blog',
        'exams'   => 'Exams',
        'orders'  => 'Orders & Checkout',
        'payments'=> 'Payments',
        'admin'   => 'Admin (CRUD)',
        'other'   => 'Other',
    ],
];
