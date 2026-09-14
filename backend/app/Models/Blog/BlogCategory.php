<?php
// app/Models/Blog/BlogCategory.php
namespace App\Models\Blog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class BlogCategory extends Model
{
    protected $guarded = [];

    // اگر تایم‌استمپ‌ها را با مایگریشن اضافه کردی، همین را نگه دار.
    // اگر عمداً نمی‌خواهی، این را فعال کن: public $timestamps = false;

    protected static function booted(): void
    {
        // ساخت اسلاگ در زمان ایجاد
        static::creating(function (BlogCategory $cat) {
            if (empty($cat->slug)) {
                $cat->slug = static::uniqueSlug($cat->name);
            }
        });

        // (اختیاری) اگر در آپدیت اسلاگ نفرستادی و name عوض شد، اسلاگ جدید بساز
        static::updating(function (BlogCategory $cat) {
            if ($cat->isDirty('name') && !$cat->isDirty('slug')) {
                $cat->slug = static::uniqueSlug($cat->name, $cat->id);
            }
        });
    }

    /** یکتا کردن اسلاگ بر اساس name (با الحاق -2, -3, ...) */
    protected static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        // اگر سایت فارسیه و می‌خوای حروف فارسی رو نگه داری، بسته‌های مخصوص لازم میشه.
        // فعلاً از Str::slug پیش‌فرض استفاده می‌کنیم.
        $base = Str::slug($name) ?: 'cat';
        $slug = $base;
        $i = 2;

        $query = static::query();
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        while ($query->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(BlogPost::class, 'blog_category_post', 'blog_category_id', 'blog_post_id');
    }
}
