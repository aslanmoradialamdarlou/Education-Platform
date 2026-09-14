<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsService;
use Illuminate\Support\Facades\Log;

class LogSmsService implements SmsService
{
    public function send(string $phone, string $message): void
    {
        Log::channel('stack')->info("SMS to {$phone}: ".$message);
    }
}
