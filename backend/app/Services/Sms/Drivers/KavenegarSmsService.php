<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsService;

class KavenegarSmsService implements SmsService
{
    public function __construct(
        private readonly ?string $apiKey = null
    ) {}

    public function send(string $phone, string $message): void
    {
        // TODO: call provider API
        // throw new \RuntimeException("Kavenegar not configured");
    }
}
