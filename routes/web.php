<?php

use App\Http\Controllers\DriveController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\InspectionTaskController;
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
    Route::get('parts/{part}/edit', [PartController::class, 'edit'])->name('api.parts.edit');
    Route::put('parts/{part}', [PartController::class, 'update'])->name('api.parts.update');
    Route::delete('parts/{part}', [PartController::class, 'destroy'])->name('api.parts.destroy');
    Route::get('parts/{part}/history', [PartController::class, 'getAttachmentHistory'])->name('api.parts.history');

    Route::get('inspections', [InspectionController::class, 'index'])->name('inspections');
    Route::post('inspections', [InspectionController::class, 'store'])->name('api.inspections.store');
    Route::get('inspections/{inspection}', [InspectionController::class, 'show'])->name('api.inspections.show');
    Route::put('inspections/{inspection}', [InspectionController::class, 'update'])->name('api.inspections.update');
    Route::delete('inspections/{inspection}', [InspectionController::class, 'destroy'])->name('api.inspections.destroy');

    // Inspection Tasks routes
    Route::post('inspection-tasks', [InspectionTaskController::class, 'store'])->name('api.inspection-tasks.store');
    Route::put('inspection-tasks/{task}', [InspectionTaskController::class, 'update'])->name('api.inspection-tasks.update');
    Route::delete('inspection-tasks/{task}', [InspectionTaskController::class, 'destroy'])->name('api.inspection-tasks.destroy');
    Route::post('inspection-tasks/{task}/results', [InspectionTaskController::class, 'recordResult'])->name('api.inspection-tasks.record-result');

    Route::get('maintenances', function () {
        return Inertia::render('maintenances');
    })->name('maintenances');

    Route::get('view-items', function () {
        return Inertia::render('view-items');
    })->name('view-items');

    // User management routes - only accessible to admins
    Route::middleware(['can:manage,App\Models\User'])->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users');
        Route::post('users', [UserController::class, 'store'])->name('api.users.store');
        Route::get('users/{user}', [UserController::class, 'show'])->name('api.users.show');
        Route::put('users/{user}', [UserController::class, 'update'])->name('api.users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('api.users.destroy');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
