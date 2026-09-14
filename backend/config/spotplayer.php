<?php

return [
    'api_key'   => env('SPOTPLAYER_API_KEY', ''),        
    'level'     => env('SPOTPLAYER_LEVEL', '-1'),        
    'base_url'  => env('SPOTPLAYER_BASE_URL', 'https://panel.spotplayer.ir'),
    'endpoint'  => env('SPOTPLAYER_LICENSE_ENDPOINT', '/license/edit/'),

    'timeout'   => env('SPOTPLAYER_TIMEOUT', 15),        
    'connect_timeout' => env('SPOTPLAYER_CONNECT_TIMEOUT', 5),

    'test'      => env('SPOTPLAYER_TEST', false),

    'backoff'   => [60, 120, 300, 600, 1800],           
    'max_tries' => env('SPOTPLAYER_MAX_TRIES', 6),      

    'default_device' => null, 
    'watermark_fallback' => 'customer',
];
