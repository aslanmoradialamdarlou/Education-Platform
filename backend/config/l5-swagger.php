<?php

return [
    'documentations' => [
        'default' => [
            'routes' => [
                'api'  => 'api/documentation',
                'docs' => 'docs',
            ],
            'paths' => [
                'docs'                   => storage_path('api-docs'),
                'docs_json'              => 'api-docs.json',
                'docs_yaml'              => false,
                'format_to_use_for_docs' => 'json',
                'annotations'            => [
                    base_path('app/OpenApi'),
                    base_path('app/Http/Controllers/Api'),
                ],
                'excludes' => [
                    base_path('vendor'), base_path('tests'), base_path('storage'),
                ],
                'base' => null,
            ],
            'middleware' => [
                'api'   => ['web'],
                'docs'  => ['web'],
                'asset' => ['web'],
            ],
        ],
    ],
];
