<?php

namespace App\Http\Requests\Commerce;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'plan_id'          => ['required','integer','exists:subscription_plans,id'],
            'qty'              => ['nullable','integer','min:1'],
            'coupon_code'      => ['nullable','string','max:50'],
            'wallet_amount'    => ['nullable','numeric','min:0'],
            // برای درگاه خاص (اختیاری)
            'gateway'          => ['nullable','string','in:sandbox,zarinpal'],
            // بازگشت فرانت (اختیاری – برای callback)
            'return_url'       => ['nullable','url','max:500'],
        ];
    }
}
