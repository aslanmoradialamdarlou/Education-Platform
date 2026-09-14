<?php
// app/Models/Media/VideoLicense.php
namespace App\Models\Media;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoLicense extends Model
{
    protected $table = 'video_licenses';
    protected $guarded = [];
    public $timestamps = false;

    protected $casts = [
        'test'       => 'boolean',
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
        'start_date' => 'datetime',
        'end_date'   => 'datetime',
        'meta'       => 'array',
        'courses'    => 'array',
        'watermark'  => 'array',
        'device'     => 'array',
    ];


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // اگر مدل محتوا تحت این فضای نام است (مطابق کنترلرهای قبلی پروژه):
    public function content(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Content\Content::class, 'content_id');
    }
}
