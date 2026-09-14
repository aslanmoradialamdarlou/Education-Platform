<?php

return [
    'default' => env('PAYMENTS_DRIVER', 'sandbox'),

    'drivers' => [
        'sandbox' => [],
        // 'zarinpal' => [
        //     'merchant_id' => env('ZARINPAL_MERCHANT_ID'),
        //     'sandbox'     => (bool) env('ZARINPAL_SANDBOX', true),
        //     'callback'    => env('ZARINPAL_CALLBACK', route('api.v1.payments.callback')),
        // ],
    ],
];
