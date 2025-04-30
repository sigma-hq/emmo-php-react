<?php

use App\Http\Controllers\DriveController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\InspectionTemplateController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\UserController;
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
    
    // Inspection Templates API routes
    Route::get('inspection-templates', [InspectionTemplateController::class, 'index'])->name('api.inspection-templates.index');
    Route::post('inspection-templates', [InspectionTemplateController::class, 'store'])->name('api.inspection-templates.store');
    Route::get('inspection-templates/{id}', [InspectionTemplateController::class, 'show'])->name('api.inspection-templates.show');
    Route::put('inspection-templates/{id}', [InspectionTemplateController::class, 'update'])->name('api.inspection-templates.update');
    Route::delete('inspection-templates/{id}', [InspectionTemplateController::class, 'destroy'])->name('api.inspection-templates.destroy');
    
    // Inspections API routes
    Route::get('api/inspections', [InspectionController::class, 'index'])->name('api.inspections.index');
    Route::post('api/inspections', [InspectionController::class, 'store'])->name('api.inspections.store');
    Route::get('api/inspections/{id}', [InspectionController::class, 'show'])->name('api.inspections.show');
    Route::put('api/inspections/{id}', [InspectionController::class, 'update'])->name('api.inspections.update');
    Route::post('api/inspections/{id}/complete', [InspectionController::class, 'complete'])->name('api.inspections.complete');
    Route::post('api/inspections/{id}/tasks/{taskId}/results', [InspectionController::class, 'recordTaskResult'])->name('api.inspections.record-task-result');
    
    // Scheduled inspection generation - admin only
    Route::post('api/generate-inspections', [InspectionController::class, 'generateScheduledInspections'])
        ->middleware('can:admin')
        ->name('api.inspections.generate');

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
