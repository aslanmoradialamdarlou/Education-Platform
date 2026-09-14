<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('token_packages', function (Blueprint $table) {
            $table->id();

            $table->string('title');                     // e.g. "بسته ۱۰۰ تایی"
            $table->unsignedInteger('tokens');           // e.g. 100
            $table->unsignedBigInteger('price');         // e.g. 20000 (تومان)

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('token_packages');
    }
};