<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Maintenance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaintenanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $maintenances = Maintenance::with(['drive:id,name,drive_ref', 'user:id,name'])
            ->select(['id', 'drive_id', 'title', 'description', 'maintenance_date', 'technician', 'status', 'cost', 'user_id', 'checklist_json', 'created_at', 'updated_at'])
            ->when($request->input('search'), function($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('technician', 'like', "%{$search}%")
                    ->orWhereHas('drive', function($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('drive_ref', 'like', "%{$search}%");
                    });
            })
            ->when($request->input('status'), function($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
        
        // Get all drives for the dropdown
        $drives = \App\Models\Drive::select('id', 'name', 'drive_ref')->orderBy('name')->get();
        
        return Inertia::render('maintenances', [
            'maintenances' => $maintenances,
            'statuses' => Maintenance::getStatusOptions(),
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
            ],
            'drives' => $drives,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'drive_id' => 'required|exists:drives,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'maintenance_date' => 'required|date',
            'technician' => 'nullable|string|max:255',
            'status' => 'required|in:pending,in_progress,completed',
            'cost' => 'nullable|numeric|min:0',
            'parts_replaced' => 'nullable|array',
            'checklist_json' => 'nullable|string',
        ]);
        
        $validated['user_id'] = auth()->id();
        
        Maintenance::create($validated);
        
        // Always return an Inertia redirect response for web form submissions
        return redirect()->back()->with('success', 'Maintenance record created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Maintenance $maintenance)
    {
        return Inertia::render('maintenance/show', [
            'maintenance' => $maintenance->load(['drive:id,name,drive_ref,location', 'user:id,name']),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Maintenance $maintenance)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Maintenance $maintenance)
    {
        $validated = $request->validate([
            'drive_id' => 'sometimes|required|exists:drives,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'maintenance_date' => 'sometimes|required|date',
            'technician' => 'nullable|string|max:255',
            'status' => 'sometimes|required|in:pending,in_progress,completed',
            'cost' => 'nullable|numeric|min:0',
            'parts_replaced' => 'nullable|array',
            'checklist_json' => 'nullable|string',
        ]);
        
        // Check if this is a status-only update and if there are checklist items
        if ($request->has('status') && count($request->all()) === 1) {
            $stats = $maintenance->getChecklistStats();
            
            // If there are checklist items, don't allow manual status updates
            if ($stats['total'] > 0) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Status is automatically managed based on task completion. Please update individual tasks instead.',
                    ], 422);
                }
                return back()->with('error', 'Status is automatically managed based on task completion');
            }
            
            // If no checklist items, allow manual status update
            $maintenance->update(['status' => $validated['status']]);
        } else {
            $maintenance->update($validated);
            
            // After updating, refresh status based on checklist if there are tasks
            $stats = $maintenance->getChecklistStats();
            if ($stats['total'] > 0) {
                $maintenance->updateStatusBasedOnChecklist();
            }
        }
        
        // For JSON/API requests
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Maintenance record updated successfully.',
                'maintenance' => $maintenance->fresh()->load(['drive:id,name,drive_ref', 'user:id,name']),
            ]);
        }
        
        // For Inertia/web requests
        return back()->with('success', 'Maintenance record updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Maintenance $maintenance)
    {
        $maintenance->delete();
        
        // Always return JSON response for API-like calls
        return response()->json([
            'success' => true,
            'message' => 'Maintenance record deleted successfully.'
        ]);
    }

    /**
     * Get maintenances for a specific drive.
     */
    public function forDrive(Drive $drive)
    {
        $maintenances = $drive->maintenances()
            ->with('user:id,name')
            ->latest()
            ->get();
        
        return response()->json($maintenances);
    }
    
    /**
     * Add a checklist item to a maintenance record.
     */
    public function addChecklistItem(Request $request, Maintenance $maintenance)
    {
        $validated = $request->validate([
            'text' => 'required|string|max:255',
            'status' => 'sometimes|string|in:pending,completed,failed',
            'notes' => 'nullable|string',
        ]);
        
        $status = $validated['status'] ?? 'pending';
        $notes = $validated['notes'] ?? null;
        
        $success = $maintenance->addChecklistItem($validated['text'], $status, $notes);
        
        if ($success) {
            return back()->with('success', 'Task added successfully');
        }
        
        return back()->with('error', 'Failed to add task. Please try again.');
    }
    
    /**
     * Update a checklist item in a maintenance record.
     */
    public function updateChecklistItem(Request $request, Maintenance $maintenance, string $itemId)
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:pending,completed,failed',
            'notes' => 'sometimes|nullable|string',
        ]);
        
        // Ensure at least one field is being updated
        if (empty($validated)) {
            return back()->with('error', 'No valid update fields provided.');
        }
        
        $success = $maintenance->updateChecklistItem($itemId, $validated);
        
        if ($success) {
            $statusLabel = isset($validated['status']) ? $validated['status'] : 'updated';
            return back()->with('success', "Task {$statusLabel} successfully");
        }
        
        return back()->with('error', 'Failed to update task. Please try again.');
    }
    
    /**
     * Remove a checklist item from a maintenance record.
     */
    public function removeChecklistItem(Request $request, Maintenance $maintenance, string $itemId)
    {
        $success = $maintenance->removeChecklistItem($itemId);
        
        if ($success) {
            return back()->with('success', 'Task deleted successfully');
        }
        
        return back()->with('error', 'Failed to delete task. Please try again.');
    }
    
    /**
     * Get checklist statistics for a maintenance record.
     */
    public function getChecklistStats(Request $request, Maintenance $maintenance)
    {
        return response()->json([
            'success' => true,
            'stats' => $maintenance->getChecklistStats(),
        ]);
    }
}
