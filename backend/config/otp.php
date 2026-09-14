<?php

return [
    'ttl'            => (int) env('OTP_TTL', 120),
    'length'         => (int) env('OTP_LENGTH', 6),
    'request_limit'  => (int) env('OTP_REQUEST_LIMIT', 3),
    'verify_limit'   => (int) env('OTP_VERIFY_LIMIT', 5),
    'window'         => (int) env('OTP_WINDOW', 300),
    'driver'         => env('OTP_DRIVER', 'log'),
    'kavenegar_api_key' => env('KAVENEGAR_API_KEY'),
];
