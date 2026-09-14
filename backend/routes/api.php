<?php

use App\Http\Controllers\Api\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\Api\Admin\BlogCategoryController;
use App\Http\Controllers\Api\Admin\BlogPostController;
use App\Http\Controllers\Api\Admin\BlogUploadController;
use App\Http\Controllers\Api\Admin\ContentController;
use App\Http\Controllers\Api\Admin\HeaderTemplateController;
use App\Http\Controllers\Api\Admin\PlanController;
use App\Http\Controllers\Api\Admin\QuestionController;
use App\Http\Controllers\Api\Admin\QuestionImportController;
use App\Http\Controllers\Api\Admin\SubscriptionController;
use App\Http\Controllers\Api\Admin\TokenController;
use App\Http\Controllers\Api\Admin\TokenPackageController;
use App\Http\Controllers\Api\Admin\VideoLicenseController;
use App\Http\Controllers\Api\Admin\StatsController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\BlogController;
use App\Http\Controllers\Api\V1\BlogCommentController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\LicenseController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProfileTokensController;
use App\Http\Controllers\Api\V1\QuestionBrowseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/* ===== Controllers (Public API v1) ===== */
use App\Http\Controllers\Api\V1\SystemController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\GradeApiController;
use App\Http\Controllers\Api\V1\BookApiController;
use App\Http\Controllers\Api\V1\ChapterApiController;
use App\Http\Controllers\Api\V1\ContentApiController;

/* ===== Controllers (Auth) ===== */
use App\Http\Controllers\AuthController;

/* ===== Controllers (Admin CRUD) ===== */
use App\Http\Controllers\Api\Admin\GradeController as AdminGradeController;
use App\Http\Controllers\Api\Admin\SubjectController as AdminSubjectController;
use App\Http\Controllers\Api\Admin\BookController as AdminBookController;
use App\Http\Controllers\Api\Admin\ChapterController as AdminChapterController;
use App\Http\Controllers\Api\Admin\SubchapterController as AdminSubchapterController;
use App\Http\Controllers\Api\Admin\ContentTypeController as AdminContentTypeController;
use App\Http\Controllers\Api\Admin\ContentController as AdminContentController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\CouponController as AdminCouponController;


/* -----------------------------------------------------------------------------
| Quick sanity
----------------------------------------------------------------------------- */
Route::get('/health', fn() => response()->json(['ok' => true, 'ts' => now()]));
Route::middleware('auth:sanctum')->get('/user', fn (Request $r) => $r->user());

/* -----------------------------------------------------------------------------
| API v1 (Public + Auth)
----------------------------------------------------------------------------- */
Route::prefix('v1')->name('api.v1.')->group(function () {

    /* --- System --- */
    Route::get('/health',  [SystemController::class, 'health'])->name('health');
    Route::get('/version', [SystemController::class, 'version'])->name('version');

    /* --- Public Catalog (read-only) --- */
    Route::get('/grades',                        [GradeApiController::class,   'grades'])->name('grades.index');
    Route::get('/grades/{grade}/books',          [GradeApiController::class,   'books'])->name('grades.books');
    Route::get('/books/{book}/chapters',         [BookApiController::class,    'chapters'])->name('books.chapters');
    Route::get('/chapters/{chapter}/subchapters',[ChapterApiController::class, 'subchapters'])->name('chapters.subchapters');
    Route::get('/chapters/{chapter}/contents',   [GradeApiController::class,   'contents'])->name('chapters.contents');
    Route::get('/subchapters/{subchapter}/contents', [ContentApiController::class, 'indexBySubchapter'])->name('subchapters.contents');
    // General contents index (with filtering)
    Route::get('/contents', [ContentApiController::class, 'index'])->name('contents.index');
    // Global content counts by type (video|booklet|sample)
    Route::get('/contents/count', [ContentApiController::class, 'count'])->name('contents.count');
    Route::get('/contents/counts', [ContentApiController::class, 'counts'])->name('contents.counts');
    // Single content by ID
    Route::get('/contents/{id}', [ContentApiController::class, 'show'])->name('contents.show');

    Route::get('/blog-posts', [BlogController::class, 'index']);                 // list
    Route::get('/blog-posts/{slugOrId}', [BlogController::class, 'show']);
    
    // Blog Comments (nested support)
    Route::get('/blog-posts/{post}/comments', [BlogCommentController::class, 'index']); // Get all comments
    Route::post('/blog-posts/{post}/comments', [BlogCommentController::class, 'store'])->middleware('auth:sanctum'); // Create comment/reply
    Route::put('/blog-posts/{post}/comments/{comment}', [BlogCommentController::class, 'update'])->middleware('auth:sanctum'); // Edit own comment
    Route::delete('/blog-posts/{post}/comments/{comment}', [BlogCommentController::class, 'destroy'])->middleware('auth:sanctum'); // Delete own comment
    Route::post('/blog-comments/{comment}/report', [BlogController::class, 'reportComment'])->middleware('auth:sanctum'); // Report a comment
    
    // Questions lightweight count (published + access-aware)
    Route::get('/questions/count', [QuestionBrowseController::class, 'count'])->name('questions.count');

    /* --- Auth (OTP/Password) --- */
    Route::prefix('auth')->group(function () {
        Route::post('/register-start',    [AuthController::class, 'registerStart'])->name('auth.register-start');
        Route::post('/register-complete', [AuthController::class, 'registerComplete'])->name('auth.register-complete');

    // Check if identifier (phone/email) exists — used by frontend to avoid duplicate signups
    Route::post('/check-identifier',   [AuthController::class, 'checkIdentifier'])->name('auth.check-identifier');

        // NEW:
        Route::post('/login-start',       [AuthController::class, 'loginStart'])->name('auth.login-start');

        Route::post('/login-otp',         [AuthController::class, 'loginWithOtp'])->name('auth.login-otp');
    Route::post('/verify-otp',        [AuthController::class, 'verifyOtp'])->name('auth.verify-otp');
        Route::post('/login-password',    [AuthController::class, 'loginWithPassword'])->name('auth.login-password');

        Route::post('/logout',            [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('auth.logout');
        Route::get('/contents/{content}', [ContentController::class,'show'])->middleware('ensure.content.access');
    });

    /* --- Profile --- */
    Route::get('/me', [AuthController::class, 'me'])
        ->middleware('auth:sanctum')
        ->name('me');
    
    Route::put('/profile', [AuthController::class, 'updateProfile'])
        ->middleware('auth:sanctum')
        ->name('profile.update');
    
    Route::post('/profile/avatar', [AuthController::class, 'updateAvatar'])
        ->middleware('auth:sanctum')
        ->name('profile.avatar');

    // Debug endpoint to inspect what the server sees for the current Bearer token.
    // Dev-only: returns authenticated user, their roles and the Authorization header.
    Route::get('/debug/auth', function (Request $r) {
        $user = $r->user();
        $roles = $user ? $user->getRoleNames() : null;
        return response()->json([
            'user' => $user,
            'roles' => $roles,
            'authorization_header' => $r->header('authorization'),
        ]);
    })->middleware('auth:sanctum')->name('debug.auth');

    /* --- Home (optional auth) --- */
    Route::get('/home', [HomeController::class, 'index'])
        ->middleware('optional.sanctum')   // اگر توکن بود، کاربر ریزالو می‌شود؛ نبود، مهمان ادامه می‌دهد
        ->name('home');

    Route::get('/questions', [QuestionBrowseController::class, 'index'])->name('questions.index');
    Route::get('/questions/{question}', [QuestionBrowseController::class, 'show'])
        ->whereNumber('question')
        ->name('questions.show');
    Route::get('/handouts', [\App\Http\Controllers\Api\V1\HandoutController::class, 'index'])->name('handouts.index');
    Route::get('/handouts/{handout}', [\App\Http\Controllers\Api\V1\HandoutController::class, 'show'])->name('handouts.show');
    Route::post('/handouts/{handout}/view', [\App\Http\Controllers\Api\V1\HandoutController::class, 'trackView'])->name('handouts.view');
    
    // Sample Questions (نمونه سوالات)
    Route::get('/sample-questions', [\App\Http\Controllers\Api\V1\SampleQuestionController::class, 'index'])->name('sample-questions.index');
    Route::get('/sample-questions/{sample_question}', [\App\Http\Controllers\Api\V1\SampleQuestionController::class, 'show'])->name('sample-questions.show');
    Route::post('/sample-questions/{sample_question}/view', [\App\Http\Controllers\Api\V1\SampleQuestionController::class, 'trackView'])->name('sample-questions.view');
    
    // Public Token Packages listing
    Route::get('/token-packages', function () {
        $packages = \App\Models\Billing\TokenPackage::orderBy('tokens', 'asc')->get();
        return response()->json([
            'code' => 'OK',
            'message' => 'Token packages list',
            'data' => $packages,
        ]);
    })->name('token-packages.index');
    
    // Public Subscription Plans listing
    Route::get('/subscription-plans', function () {
        $plans = \App\Models\Billing\SubscriptionPlan::where('is_active', true)
            ->orderBy('price', 'asc')
            ->get();
        return response()->json([
            'code' => 'OK',
            'message' => 'Subscription plans list',
            'data' => $plans,
        ]);
    })->name('subscription-plans.index');
    
    Route::get('/questions/{question}/preview', [QuestionBrowseController::class, 'preview'])
        ->whereNumber('question')
        ->name('questions.preview');

    Route::middleware('auth:sanctum')->group(function () {
        // دانلود جزوه - نیاز به احراز هویت برای امنیت و چک توکن/اشتراک
        Route::get('/handouts/{handout}/download', [\App\Http\Controllers\Api\V1\HandoutController::class, 'download'])
            ->name('handouts.download');
        
        // دانلود نمونه سوال - نیاز به احراز هویت برای امنیت و چک توکن/اشتراک
        Route::get('/sample-questions/{sample_question}/download', [\App\Http\Controllers\Api\V1\SampleQuestionController::class, 'download'])
            ->name('sample-questions.download');
            
        // Question Sets (User's custom collections)
        Route::get('/question-sets', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'index'])
            ->name('question-sets.index');
        Route::post('/question-sets', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'store'])
            ->name('question-sets.store');
        Route::get('/question-sets/{id}', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'show'])
            ->name('question-sets.show');
        Route::put('/question-sets/{id}', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'update'])
            ->name('question-sets.update');
        Route::delete('/question-sets/{id}', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'destroy'])
            ->name('question-sets.destroy');
        Route::post('/question-sets/{id}/questions', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'addQuestion'])
            ->name('question-sets.add-question');
        Route::delete('/question-sets/{setId}/questions/{questionId}', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'removeQuestion'])
            ->name('question-sets.remove-question');
        Route::post('/question-sets/{id}/reorder', [\App\Http\Controllers\Api\V1\QuestionSetController::class, 'reorderQuestions'])
            ->name('question-sets.reorder');
            
        // Tickets & Support
        Route::get('/tickets', [\App\Http\Controllers\Api\TicketController::class, 'index']);
        Route::post('/tickets', [\App\Http\Controllers\Api\TicketController::class, 'store']);
        Route::get('/tickets/{id}', [\App\Http\Controllers\Api\TicketController::class, 'show']);
        Route::post('/tickets/{id}/messages', [\App\Http\Controllers\Api\TicketController::class, 'addMessage']);
        Route::post('/tickets/{id}/close', [\App\Http\Controllers\Api\TicketController::class, 'close']);

        // Exams
        Route::apiResource('exams', ExamController::class)
            ->only(['index','store','show','update','destroy']);

        Route::get('exams/{exam}/questions', [ExamController::class, 'questions'])
            ->name('exams.questions');

        Route::post('exams/{exam}/items', [ExamController::class, 'addQuestion']);
        Route::post('exams/{exam}/questions', [ExamController::class, 'addQuestions']) // bulk
        ->name('exams.questions.bulk');

        Route::delete('exams/{exam}/items/{item}', [ExamController::class, 'removeQuestion']);
        Route::patch('exams/{exam}/questions/reorder', [ExamController::class, 'reorder']);

        Route::post('exams/{exam}/export', [ExamController::class, 'exportPdf']);
        Route::get('exams/{exam}/answer-key', [ExamController::class, 'exportAnswerKey']);

        Route::patch('exams/{exam}/layout', [ExamController::class,'updateLayout']);
    });
});

/* -----------------------------------------------------------------------------
| Admin API v1 (CRUD)
| پیش‌فرض: فقط نقش admin اجازه دارد.
| اگر خواستی ریزتر کنی، می‌توانی permission middleware اضافه کنی.
----------------------------------------------------------------------------- */
Route::prefix('v1/admin')
    ->name('api.v1.admin.')
    // Accept both canonical 'admin' and legacy/alternate 'Administrator' role names using the 'api' guard.
    ->middleware(['auth:sanctum', 'role:admin|Administrator,api'])
    ->group(function () {

        // محدودیت: پارامتر {question} فقط عدد
        Route::pattern('question', '[0-9]+');

        // --- routes کمکی questions را قبل از resource بگذار ---
        Route::get('questions/import-template', [QuestionController::class, 'downloadTemplate'])
            ->name('questions.import-template');
        Route::post('questions/import', [QuestionController::class, 'import'])
            ->name('questions.import');

        Route::post('questions/{question}/publish', [QuestionController::class,'publish'])
            ->name('questions.publish');
        Route::post('questions/{question}/archive', [QuestionController::class,'archive'])
            ->name('questions.archive');
        Route::post('questions/{question}/assets',  [QuestionController::class,'uploadAsset'])
            ->name('questions.assets');

        // --- بقیه منابع ---
        Route::apiResource('questions', QuestionController::class);

    // Question types list (admin)
    Route::get('question-types', [\App\Http\Controllers\Api\Admin\QuestionTypeController::class, 'index'])->name('question-types.index');

        Route::apiResource('grades',        AdminGradeController::class);
        Route::apiResource('subjects',      AdminSubjectController::class);
        Route::apiResource('books',         AdminBookController::class);
        Route::apiResource('chapters',      AdminChapterController::class);
        Route::apiResource('subchapters',   AdminSubchapterController::class);
        Route::apiResource('content-types', AdminContentTypeController::class);
        Route::apiResource('contents',      AdminContentController::class);
        Route::apiResource('blog-categories', BlogCategoryController::class);
        Route::apiResource('blog-posts', BlogPostController::class);
        Route::apiResource('token-packages', TokenPackageController::class);
    // Admin handouts CRUD
    Route::apiResource('handouts', \App\Http\Controllers\Api\Admin\HandoutController::class);
        Route::get('handouts/{handout}/stats', [\App\Http\Controllers\Api\Admin\HandoutController::class, 'stats'])->name('handouts.stats');
        Route::post('blog-posts/{post}/publish', [BlogPostController::class, 'publish']);
        Route::post('blog-posts/{post}/archive', [BlogPostController::class, 'archive']);
        Route::get('blog-slug/check', [BlogPostController::class, 'checkSlug']);
        Route::post('blog/uploads', [BlogUploadController::class, 'store']);
        Route::apiResource('users', AdminUserController::class);
        Route::patch('users/{user}/suspend', [AdminUserController::class, 'suspend']);
        Route::patch('users/{user}/activate', [AdminUserController::class, 'activate']);
    // Per-user nested resources
    Route::get('users/{user}/activity-logs', [\App\Http\Controllers\Api\Admin\UserActivityController::class, 'index']);
    Route::get('users/{user}/wallet', [\App\Http\Controllers\Api\Admin\UserWalletController::class, 'show']);
    Route::post('users/{user}/wallet/adjust', [\App\Http\Controllers\Api\Admin\UserWalletController::class, 'adjust']);
    Route::get('users/{user}/video-licenses', [\App\Http\Controllers\Api\Admin\UserLicenseController::class, 'index']);
        Route::post('questions/import', [QuestionImportController::class, 'import'])->name('questions.import');
        Route::get('questions/import/{batch}', [QuestionImportController::class, 'status'])->name('questions.import.status');
        Route::get('questions/import-template', [QuestionController::class, 'downloadTemplate'])
            ->name('questions.import-template');
        Route::apiResource('exam-header-templates', HeaderTemplateController::class);
        Route::post('question-imports', [QuestionImportController::class, 'store']);
        Route::get('question-imports/{import}', [QuestionImportController::class, 'show']);
        Route::get('imports/{batch}', [QuestionImportController::class, 'show'])
            ->name('imports.show');
        Route::get('imports/{batch}/errors', [QuestionImportController::class, 'errors'])
            ->name('imports.errors');
        Route::apiResource('plans', PlanController::class);
        Route::apiResource('subscriptions', SubscriptionController::class)->only(['index','store','show','update','destroy']);
        Route::post('tokens/topup', [TokenController::class, 'topup']);
        Route::post('video-licenses', [VideoLicenseController::class, 'store'])
            ->name('video-licenses.store');
        // Coupons (Discounts)
        Route::apiResource('coupons', AdminCouponController::class);
        Route::patch('coupons/{coupon}/activate',  [AdminCouponController::class, 'activate']);
        Route::patch('coupons/{coupon}/deactivate',[AdminCouponController::class, 'deactivate']);
        
        // Admin Tickets Management
        Route::get('tickets', [AdminTicketController::class, 'index']);
        Route::get('tickets/{id}', [AdminTicketController::class, 'show']);
        Route::post('tickets/{id}/messages', [AdminTicketController::class, 'addMessage']);
        Route::put('tickets/{id}/status', [AdminTicketController::class, 'updateStatus']);
        Route::put('tickets/{id}/priority', [AdminTicketController::class, 'updatePriority']);
        
        // Dashboard KPIs
        Route::get('stats', [StatsController::class, 'index'])->name('stats');
        Route::get('me/tokens',         [BillingController::class, 'tokens'])->name('me.tokens');
        Route::get('me/subscriptions',  [BillingController::class, 'subscriptions'])->name('me.subscriptions');
        Route::get('me/token-usages',   [BillingController::class, 'tokenUsages'])->name('me.token-usages');
        Route::get('contents/{content}', [ContentController::class,'show'])
            // ->middleware('content.access')
            ->name('contents.show');
    });

Route::prefix('v1')->name('api.v1.')->group(function () {

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me/tokens',         [ProfileTokensController::class, 'tokens'])->name('me.tokens');
        Route::get('/me/subscriptions',  [ProfileTokensController::class, 'subscriptions'])->name('me.subscriptions');
        Route::get('/me/token-usage',    [ProfileTokensController::class, 'tokenUsage'])->name('me.token-usage');

        Route::get('/licenses',             [LicenseController::class, 'index'])->name('licenses.index');
        Route::get('/licenses/{license}',   [LicenseController::class, 'show'])->name('licenses.show');
        Route::post('/licenses/issue',    [LicenseController::class, 'store'])->name('licenses.issue');
        Route::post('licenses/{license}/retry',[LicenseController::class, 'retry'])->name('licenses.retry');
    });
});

Route::prefix('v1')->name('api.v1.')->group(function () {

    // ... روت‌های قبلی

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
        Route::post('/checkout/free', [CheckoutController::class, 'storeFree'])->name('checkout.free');
        Route::get('/orders/{order}', [CheckoutController::class, 'show'])->name('orders.show');
    });

    // پرداخت (callback – معمولاً بدون auth)
    Route::get('/payments/callback', [PaymentController::class, 'callback'])->name('payments.callback');

    // شبیه‌ساز Sandbox
    Route::get('/payments/sandbox/callback', [PaymentController::class, 'sandboxCallback'])
        ->name('payments.sandbox.callback');
});

Route::prefix('v1/payments')->name('api.v1.payments.')->group(function () {
    Route::get('{order}/pay',        [PaymentController::class, 'pay'])->name('pay');
    Route::get('callback', [PaymentController::class, 'callback'])
    ->name('callback_plain');
    Route::get('success',            [PaymentController::class, 'success'])->name('success');
    Route::get('failed',             [PaymentController::class, 'failed'])->name('failed');
});


Route::prefix('v1')->name('api.v1.')->group(function () {

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/orders',           [\App\Http\Controllers\Api\V1\OrderController::class,'index'])->name('orders.index'); // ✅ اضافه شد
        Route::post('/orders',          [\App\Http\Controllers\Api\V1\OrderController::class,'store'])->name('orders.store');
        Route::get('/orders/{order}',   [\App\Http\Controllers\Api\V1\OrderController::class,'show'])->name('orders.show');

        Route::post('/orders/{order}/pay', [\App\Http\Controllers\Api\V1\PaymentController::class,'pay'])->name('orders.pay');
    });

    // کال‌بک درگاه (بدون auth)
    // Route::get('/payments/{driver}/callback', [\App\Http\Controllers\Api\V1\PaymentController::class,'callback'])
    //     ->name('payments.callback');
});

Route::get('/ping', fn () => response()->json([
    'ok' => true,
    'app' => config('app.name'),
]));
