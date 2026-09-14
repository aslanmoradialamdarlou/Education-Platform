<?php
// database/migrations/2025_08_24_120000_alter_video_licenses_add_remote_fields.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('video_licenses', function (Blueprint $t) {
            if (!Schema::hasColumn('video_licenses','license_id'))   $t->string('license_id',120)->nullable()->after('content_id');
            if (!Schema::hasColumn('video_licenses','license_key'))  $t->text('license_key')->nullable()->after('license_id');
            if (!Schema::hasColumn('video_licenses','url'))          $t->string('url',500)->nullable()->after('license_key');
            if (!Schema::hasColumn('video_licenses','name'))         $t->string('name',150)->nullable()->after('url');
            if (!Schema::hasColumn('video_licenses','courses'))      $t->json('courses')->nullable()->after('name');
            if (!Schema::hasColumn('video_licenses','test'))         $t->boolean('test')->default(false)->after('courses');
            if (!Schema::hasColumn('video_licenses','watermark'))    $t->json('watermark')->nullable()->after('test');
            if (!Schema::hasColumn('video_licenses','device'))       $t->json('device')->nullable()->after('watermark');
            if (!Schema::hasColumn('video_licenses','payload'))      $t->string('payload',200)->nullable()->after('device');
            if (!Schema::hasColumn('video_licenses','starts_at'))    $t->timestamp('starts_at')->nullable()->after('payload');
            if (!Schema::hasColumn('video_licenses','ends_at'))      $t->timestamp('ends_at')->nullable()->after('starts_at');
            if (!Schema::hasColumn('video_licenses','status'))       $t->enum('status',['pending','active','expired','revoked','failed'])->default('pending')->change();
        });
    }
    public function down(): void {
        // عمداً خالی (در محیط dev می‌تونی دستی drop کنی)
    }
};
