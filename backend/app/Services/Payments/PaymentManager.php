<?php

namespace App\Services\Payments;

use App\Services\Payments\Contracts\PaymentGateway;
use App\Services\Payments\Drivers\SandboxGateway;
use InvalidArgumentException;

class PaymentManager
{
    /** @var array<string, callable|PaymentGateway> */
    protected array $drivers;

    public function __construct()
    {
        // می‌تونی بعداً از سرویس‌کانتینر تزریق کنی؛ فعلاً ساده:
        $this->drivers = [
            'sandbox' => fn() => new SandboxGateway(),
            // 'zarinpal' => fn() => new ZarinpalGateway(...),
            // ...
        ];
    }

    public function driver(string $name): PaymentGateway
    {
        if (! isset($this->drivers[$name])) {
            throw new InvalidArgumentException("Unknown payment driver: {$name}");
        }
        $d = $this->drivers[$name];
        $instance = \is_callable($d) ? $d() : $d;

        // اطمینان از نوع
        if (! $instance instanceof PaymentGateway) {
            throw new \RuntimeException("Driver {$name} must implement PaymentGateway.");
        }
        return $instance;
    }
}
