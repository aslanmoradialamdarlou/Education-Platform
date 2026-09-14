<?php

// app/Events/OrderPaid.php
namespace App\Events;

use App\Models\Commerce\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderPaid
{
    use Dispatchable, SerializesModels;

    public Order $order;
    public ?string $gatewayRef;
    public array $context; // driver, payload, ...

    public function __construct(Order $order, ?string $gatewayRef = null, array $context = [])
    {
        $this->order      = $order->withoutRelations();
        $this->gatewayRef = $gatewayRef;
        $this->context    = $context;
    }
}
