<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:3000'), 
        'http://localhost:5173', 'http://127.0.0.1:5173',
        'http://localhost:4173', 'http://127.0.0.1:4173', 
        'http://localhost:3000', 'http://127.0.0.1:3000', 
        'http://195.177.255.8', 'http://195.177.255.8:3000', 
    ]),
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
