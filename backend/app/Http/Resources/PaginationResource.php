<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * رَپر استاندارد برای صفحه‌بندی:
 * {
 *   "code":"OK",
 *   "message":"ok",
 *   "data": {
 *     "items": [...],
 *     "meta": { "current_page":1, ... }
 *   }
 * }
 *
 * نمونه استفاده:
 * return (new PaginationResource(UserResource::collection($query->paginate())))
 *          ->additional(['code'=>'OK','message'=>'ok']);
 */
class PaginationResource extends ResourceCollection
{
    public function toArray($request): array
    {
        $pagination = $this->resource->toArray();

        return [
            'items' => $pagination['data'] ?? [],
            'meta'  => [
                'current_page' => $pagination['current_page'] ?? null,
                'per_page'     => $pagination['per_page'] ?? null,
                'total'        => $pagination['total'] ?? null,
                'last_page'    => $pagination['last_page'] ?? null,
            ],
        ];
    }
}
