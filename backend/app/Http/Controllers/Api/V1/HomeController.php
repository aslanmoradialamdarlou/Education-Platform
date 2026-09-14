<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Blog\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Cache, DB};
use App\Models\Curriculum\Grade;
use App\Models\Billing\SubscriptionPlan;

class HomeController extends Controller
{
    public function index(Request $r)
    {
        $user = $r->user();

        // ---------- HEADER ----------
        $header = [
            'logo' => '/static/logo.svg',
            'account' => $this->accountBlock($user),
            'menu' => $this->userMenu($user),
        ];

        // ---------- BODY: Grades quick actions ----------
        $grades = Cache::remember('home:grades:list', 600, function () {
            return Grade::orderBy('id')->get(['id','name'])->map(function ($g) {
                return [
                    'id'   => $g->id,
                    'name' => $g->name,
                    'actions' => [
                        ['key'=>'question_bank','label'=>'بانک سوال',  'href'=>"/app/question-bank?grade_id={$g->id}"],
                        ['key'=>'booklet',      'label'=>'جزوه',       'href'=>"/app/contents?grade_id={$g->id}&type=booklet"],
                        ['key'=>'video',        'label'=>'فیلم',       'href'=>"/app/contents?grade_id={$g->id}&type=video"],
                        ['key'=>'sample',       'label'=>'نمونه سوال', 'href'=>"/app/contents?grade_id={$g->id}&type=sample"],
                        ['key'=>'labs',         'label'=>'آزمایشات',   'href'=>"/app/labs?grade_id={$g->id}"],
                    ],
                ];
            })->values();
        });

        // ---------- BODY: Blog (filters + top 4 cards) ----------
        $blog = Cache::remember('home:blog:cards', 300, function () {
            $cards = BlogPost::query()
                ->where('status', 'published')
                ->orderByDesc('published_at')
                ->limit(4)
                ->withCount([
                    'likes as likes_count',
                    'comments as comments_count',
                ])
                ->limit(4)
                ->get(['id','title','slug','published_at'])
                ->map(function ($p) {
                    return [
                        'id'             => $p->id,
                        'title'          => $p->title,
                        'slug'           => $p->slug,
                        'image'          => $this->blogMainImage($p->id), // placeholder/real
                        'comments_count' => (int) ($p->comments_count ?? 0),
                        'likes_count'    => (int) ($p->likes_count ?? 0),
                        'published_at'   => optional($p->published_at)->toDateString(),
                        'url'            => "/blog/{$p->slug}",
                    ];
                });

            return [
                'filters' => [
                    ['key'=>'latest','label'=>'جدیدترین'],
                    ['key'=>'hot','label'=>'داغ'],
                    ['key'=>'grade_7','label'=>'هفتم'],
                    ['key'=>'grade_8','label'=>'هشتم'],
                    ['key'=>'grade_9','label'=>'نهم'],
                ],
                'cards'   => $cards,
                'all_url' => '/blog',
            ];
        });

        // ---------- FOOTER ----------
        $footer = [
            'links' => [
                ['label'=>'درباره ما','href'=>'/about'],
                ['label'=>'تماس با ما','href'=>'/contact'],
                ['label'=>'قوانین','href'=>'/terms'],
                ['label'=>'حریم خصوصی','href'=>'/privacy'],
            ],
            'copyright' => '© '.now()->year.' آکادمی علوم',
        ];

        // ---------- ETag ----------
        $etag = sha1(json_encode([
            optional($user)->id,
            $grades->count(),
            optional($blog['cards'])->max('id'),
        ]));

        if ($r->headers->get('If-None-Match') === $etag) {
            return response('', 304)->header('ETag', $etag);
        }

        return response()->json([
            'code'    => 'OK',
            'message' => 'Homepage data',
            'data'    => [
                'header' => $header,
                'body'   => [
                    'grades' => $grades,
                    'blog'   => $blog,
                ],
                'footer' => $footer,
            ],
        ])->header('ETag', $etag);
    }

    // ================== helpers ==================

    private function accountBlock($user): array
    {
        if (! $user) {
            return [
                'is_authenticated' => false,
            ];
        }

        // subscription (ساده: فعال‌ترین سابسکریپشن جاری)
        $sub = DB::table('subscriptions')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByDesc('end_date')
            ->first();

        $daysLeft = null;
        $planMeta = null;

        if ($sub && $sub->end_date) {
            $daysLeft = now()->diffInDays(\Carbon\Carbon::parse($sub->end_date), false);
            $plan = SubscriptionPlan::find($sub->plan_id);
            if ($plan) {
                $planMeta = ['id'=>$plan->id,'name'=>$plan->name];
            }
        }

        // wallet
        $wallet = DB::table('wallets')->where('user_id', $user->id)->first();
        $balance = $wallet ? (float) $wallet->balance : 0;

        // notifications
        $unread = DB::table('notifications')
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return [
            'is_authenticated' => true,
            'user' => [
                'id'   => $user->id,
                'name' => $user->name ?? trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: $user->phone,
            ],
            'subscription' => [
                'active'     => (bool) $sub,
                'days_left'  => $sub ? max(0, $daysLeft) : null,
                'plan'       => $planMeta,
            ],
            'wallet' => [
                'balance'  => $balance,
                'currency' => 'IRR',
            ],
            'notifications' => [
                'unread_count' => (int) $unread,
            ],
        ];
    }

    private function userMenu($user): array
    {
        return [
            ['label'=>'پروفایل من',     'href'=>'/profile'],
            ['label'=>'لایسنس‌های من',  'href'=>'/licenses'],
            ['label'=>'فاکتورهای مالی', 'href'=>'/billing'],
            ['label'=>'تیکت و پشتیبانی','href'=>'/support'],
            ['label'=>'خروج',            'href'=>'/logout'],
        ];
    }

    private function blogMainImage(int $postId): string
    {
        // اگر مدیافایل داری از آنجا بخوان، فعلاً placeholder
        return "/static/blog/{$postId}.jpg";
    }
}
