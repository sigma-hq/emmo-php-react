<?php

use App\Http\Controllers\DriveController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\InspectionTaskController;
use App\Http\Controllers\InspectionSubTaskController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('drive', [DriveController::class, 'index'])->name('drive');

    Route::post('drives', [DriveController::class, 'store'])->name('api.drives.store');
    Route::post('drives/import', [DriveController::class, 'import'])->name('api.drives.import');
    Route::get('drives/{drive}', [DriveController::class, 'show'])->name('api.drives.show');
    Route::put('drives/{drive}', [DriveController::class, 'update'])->name('api.drives.update');
    Route::delete('drives/{drive}', [DriveController::class, 'destroy'])->name('api.drives.destroy');

    Route::get('parts', [PartController::class, 'index'])->name('parts');
    Route::post('parts', [PartController::class, 'store'])->name('api.parts.store');
    Route::post('parts/import', [PartController::class, 'import'])->name('api.parts.import');
    Route::get('parts/import/template', [PartController::class, 'downloadImportTemplate'])->name('api.parts.import.template');
    Route::get('parts/{part}', [PartController::class, 'show'])->name('api.parts.show');
    Route::get('parts/{part}/edit', [PartController::class, 'edit'])->name('api.parts.edit');
    Route::put('parts/{part}', [PartController::class, 'update'])->name('api.parts.update');
    Route::post('parts/{part}/attachment', [PartController::class, 'updateAttachment'])->name('api.parts.update-attachment');
    Route::delete('parts/{part}', [PartController::class, 'destroy'])->name('api.parts.destroy');
    Route::get('parts/{part}/history', [PartController::class, 'getAttachmentHistory'])->name('api.parts.history');
    Route::get('api/unattached-parts', [PartController::class, 'getUnattachedParts'])->name('api.parts.unattached');

    Route::get('inspections', [InspectionController::class, 'index'])->name('inspections');
    Route::post('inspections', [InspectionController::class, 'store'])->name('api.inspections.store');
    Route::get('inspections/{inspection}', [InspectionController::class, 'show'])->name('inspections.show');
    Route::put('inspections/{inspection}', [InspectionController::class, 'update'])->name('api.inspections.update');
    Route::delete('inspections/{inspection}', [InspectionController::class, 'destroy'])->name('api.inspections.destroy');

    // Maintenance routes
    Route::get('maintenances', [MaintenanceController::class, 'index'])->name('maintenances');
    Route::post('maintenances', [MaintenanceController::class, 'store'])->name('api.maintenances.store');
    Route::get('maintenances/{maintenance}', [MaintenanceController::class, 'show'])->name('api.maintenances.show');
    Route::put('maintenances/{maintenance}', [MaintenanceController::class, 'update'])->name('api.maintenances.update');
    Route::delete('maintenances/{maintenance}', [MaintenanceController::class, 'destroy'])->name('api.maintenances.destroy');
    Route::get('drives/{drive}/maintenances', [MaintenanceController::class, 'forDrive'])->name('api.drives.maintenances');
    
    // Maintenance checklist item routes
    Route::post('maintenances/{maintenance}/checklist', [MaintenanceController::class, 'addChecklistItem'])->name('api.maintenances.checklist.add');
    Route::put('maintenances/{maintenance}/checklist/{itemId}', [MaintenanceController::class, 'updateChecklistItem'])->name('api.maintenances.checklist.update');
    Route::delete('maintenances/{maintenance}/checklist/{itemId}', [MaintenanceController::class, 'removeChecklistItem'])->name('api.maintenances.checklist.remove');
    Route::get('maintenances/{maintenance}/checklist-stats', [MaintenanceController::class, 'getChecklistStats'])->name('api.maintenances.checklist.stats');

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

    // Debug route for inspection tasks
    Route::post('debug-inspection-task', function (Request $request) {
        Log::info('Debug inspection task - request data:', $request->all());
        return response()->json([
            'success' => true,
            'message' => 'Debug endpoint called',
            'request_data' => $request->all()
        ]);
    })->name('debug.inspection-task');

    // Inspection Tasks routes
    Route::post('inspection-tasks', [InspectionTaskController::class, 'store'])->name('inspection-tasks.store');
    Route::get('inspection-tasks/{task}', [InspectionTaskController::class, 'show'])->name('inspection-tasks.show');
    Route::put('inspection-tasks/{task}', [InspectionTaskController::class, 'update'])->name('inspection-tasks.update');
    Route::delete('inspection-tasks/{task}', [InspectionTaskController::class, 'destroy'])->name('inspection-tasks.destroy');
    Route::post('inspection-tasks/{task}/results', [InspectionTaskController::class, 'recordResult'])->name('inspection-tasks.record-result');
    
    // Inspection Sub-Tasks routes
    Route::post('inspection-sub-tasks', [InspectionSubTaskController::class, 'store'])->name('api.inspection-sub-tasks.store');
    Route::put('inspection-sub-tasks/{subTask}', [InspectionSubTaskController::class, 'update'])->name('api.inspection-sub-tasks.update');
    Route::delete('inspection-sub-tasks/{subTask}', [InspectionSubTaskController::class, 'destroy'])->name('api.inspection-sub-tasks.destroy');
    Route::patch('inspection-sub-tasks/{subTask}/toggle-status', [InspectionSubTaskController::class, 'toggleStatus'])->name('api.inspection-sub-tasks.toggle-status');
    Route::post('inspection-sub-tasks/reorder', [InspectionSubTaskController::class, 'reorder'])->name('api.inspection-sub-tasks.reorder');
    Route::post('inspection-sub-tasks/{subTask}/results', [InspectionSubTaskController::class, 'recordResult'])->name('api.inspection-sub-tasks.record-result');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
