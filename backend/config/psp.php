<?php
return [
    'default' => env('PSP_DRIVER', 'zarinpal'),
    'drivers' => [
        'zarinpal' => [
            'merchant_id' => env('ZARINPAL_MERCHANT'),
            'sandbox'     => (bool) env('ZARINPAL_SANDBOX', true),
            'callback'    => env('PSP_CALLBACK_URL', env('APP_URL').'/api/v1/payment/callback/zarinpal'),
        ],
        'idpay' => [
            'api_key'  => env('IDPAY_API_KEY'),
            'sandbox'  => (bool) env('IDPAY_SANDBOX', true),
            'callback' => env('APP_URL').'/api/v1/payment/callback/idpay',
            'webhook'  => env('APP_URL').'/api/v1/payment/webhook/idpay',
        ],
    ],
];
