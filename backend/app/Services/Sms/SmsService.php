<?php

namespace App\Services\Sms;

interface SmsService {
    public function send(string $phone, string $message): void;
}
