<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Curriculum\Subchapter;

class SubchapterUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('catalog.manage') ?? false;
    }

    public function rules(): array
    {
        /** @var Subchapter $subchapter */
        $subchapter = $this->route('subchapter');

        return [
            'chapter_id' => ['sometimes','integer','exists:chapters,id'],
            'number'     => [
                'sometimes','integer','between:1,300',
                // یکتا داخل هر فصل
                Rule::unique('subchapters','number')
                    ->ignore($subchapter?->id)
                    ->where(fn($q) => $q->where('chapter_id', $this->input('chapter_id', $subchapter?->chapter_id))),
            ],
            'title'      => ['sometimes','string','max:150'],
        ];
    }
}
