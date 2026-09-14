<?php

namespace App\Services\Payments\Contracts;

use App\Models\Commerce\Order;
use Illuminate\Http\Request;

interface PaymentGateway
{
    /** شروع پرداخت و برگرداندن URL/redirect مورد نیاز */
    public function pay(Order $order): array;

    /** شروع پرداخت با پارامترهای اضافی */
    public function start(Order $order, array $options = []): string;

    /** شبیه‌سازی پرداخت برای سفارش‌های با مبلغ صفر */
    public function simulateZeroPay(Order $order): string;

    /** کال‌بک/وبهوک درگاه */
    public function callback(Request $request): array;

    /** نام درگاه (برای لاگ/دیباگ) */
    public function name(): string;
}
