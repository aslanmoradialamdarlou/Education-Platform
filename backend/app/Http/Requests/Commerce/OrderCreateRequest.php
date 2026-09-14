<?php

namespace App\Http\Requests\Commerce;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->id > 0;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.type' => ['required', 'string', Rule::in(['plan'])],
            'items.*.id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],

            'coupon_code' => ['nullable', 'string', 'max:50'],
            // یکی از این دو:
            'wallet_use' => ['nullable', 'boolean'],               // اگر true یعنی تا سقف موجودی
            'wallet_amount' => ['nullable', 'numeric', 'min:0'],       // یا مقدار دلخواه (ریال)

            'currency' => ['nullable', 'string', 'max:10'],       // پیش‌فرض IRR
        ];
    }
}
