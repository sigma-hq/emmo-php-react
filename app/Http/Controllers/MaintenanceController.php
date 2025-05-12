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
        
        return Inertia::render('maintenances', [
            'maintenances' => $maintenances,
            'statuses' => Maintenance::getStatusOptions(),
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
            ],
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
        
        // If only status is being updated, allow it without other validations
        if ($request->has('status') && count($request->all()) === 1) {
            $maintenance->update(['status' => $validated['status']]);
        } else {
        $maintenance->update($validated);
        }
        
        // Always return JSON response as this is used by API-like calls from the frontend tab
            return response()->json([
                'success' => true,
            'message' => 'Maintenance record updated successfully.',
                'maintenance' => $maintenance->fresh()->load(['drive:id,name,drive_ref', 'user:id,name']),
            ]);
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
}
