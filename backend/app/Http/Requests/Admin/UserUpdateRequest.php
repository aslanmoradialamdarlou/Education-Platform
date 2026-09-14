<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return ($user && ($user->hasRole('admin') || $user->hasRole('Administrator'))) || $user?->can('users.update');
    }

    public function rules(): array
    {
        $id = $this->route('user')?->id ?? null;

        return [
            'first_name' => ['sometimes','string','max:100'],
            'last_name'  => ['sometimes','string','max:100'],
            'phone'      => ['sometimes','string','max:20',"unique:users,phone,{$id}"],
            'email'      => ['sometimes','nullable','email','max:255',"unique:users,email,{$id}"],
            'grade_id'   => ['sometimes','nullable','integer','exists:grades,id'],
            'province'   => ['sometimes','nullable','string','max:100'],
            'city'       => ['sometimes','nullable','string','max:100'],
            'password'   => ['sometimes','nullable','string','min:6'],
            'roles'      => ['sometimes','array'],
            'roles.*'    => ['string','exists:roles,name'],
            'is_active'  => ['sometimes','boolean'],
        ];
    }
}
