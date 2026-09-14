<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return ($user && ($user->hasRole('admin') || $user->hasRole('Administrator'))) || $user?->can('users.create');
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required','string','max:100'],
            'last_name'  => ['required','string','max:100'],
            'phone'      => ['required','string','max:20','unique:users,phone'],
            'email'      => ['nullable','email','max:255','unique:users,email'],
            'grade_id'   => ['nullable','integer','exists:grades,id'],
            'province'   => ['nullable','string','max:100'],
            'city'       => ['nullable','string','max:100'],
            'password'   => ['nullable','string','min:6'],
            'roles'      => ['nullable','array'],
            'roles.*'    => ['string','exists:roles,name'],
            'is_active'  => ['nullable','boolean'],
        ];
    }
}
