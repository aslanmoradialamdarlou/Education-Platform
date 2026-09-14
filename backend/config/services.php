<?php

return [

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'spotplayer' => [
        'api'      => env('SPOTPLAYER_API_KEY'),
        'level'    => env('SPOTPLAYER_LEVEL','-1'),
        'endpoint' => env('SPOTPLAYER_ENDPOINT','https://panel.spotplayer.ir/license/edit/'),
        'dl'       => env('SPOTPLAYER_DL_DOMAIN','https://dl.spotplayer.ir'),
    ],

];
