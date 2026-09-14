<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => ['Laravel' => app()->version()]);

// step 1: quick text check (optional)
// Route::get('/docs/api', fn () => 'DOCS OK');

// step 2: real blade view
Route::get('/docs/api', fn () => view('api-docs'));

require __DIR__.'/auth.php';
