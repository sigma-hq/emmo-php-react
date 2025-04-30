<?php

use App\Http\Controllers\DriveController;
use App\Http\Controllers\PartController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('drive', [DriveController::class, 'index'])->name('drive');

    Route::post('drives', [DriveController::class, 'store'])->name('api.drives.store');
    Route::get('drives/{drive}', [DriveController::class, 'show'])->name('api.drives.show');
    Route::put('drives/{drive}', [DriveController::class, 'update'])->name('api.drives.update');
    Route::delete('drives/{drive}', [DriveController::class, 'destroy'])->name('api.drives.destroy');

    Route::get('parts', [PartController::class, 'index'])->name('parts');
    Route::post('parts', [PartController::class, 'store'])->name('api.parts.store');
    Route::get('parts/{part}', [PartController::class, 'show'])->name('api.parts.show');
    Route::put('parts/{part}', [PartController::class, 'update'])->name('api.parts.update');
    Route::delete('parts/{part}', [PartController::class, 'destroy'])->name('api.parts.destroy');

    Route::get('inspections', function () {
        return Inertia::render('inspections');
    })->name('inspections');

    Route::get('maintenances', function () {
        return Inertia::render('maintenances');
    })->name('maintenances');

    Route::get('view-items', function () {
        return Inertia::render('view-items');
    })->name('view-items');

    Route::get('users', function () {
        return Inertia::render('users');
    })->name('users');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
