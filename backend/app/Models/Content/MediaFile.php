<?php
namespace App\Models\Content;

use Illuminate\Database\Eloquent\Model;

class MediaFile extends Model
{
    protected $guarded = [];

    // اگر بخواهی polymorphic واقعی: بهتره مایگریشن را morphs بسازی.
    // فعلاً با فیلدهای موجود:
    public function owner()
    {
        // مدل را براساس owner_type خودت resolve کن
        // اینجا به سادگی از map استفاده کن (دلخواه)
    }
}
