<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Maintenance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\Response;

class MaintenanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
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
            // Filter by user role - operators see maintenances they created OR are assigned to
            ->when(!$isAdmin, function($query) use ($user) {
                $query->where(function($q) use ($user) {
                    $q->where('user_id', $user->id)  // Maintenances they created
                      ->orWhere('technician', $user->name); // Maintenances they're assigned to
                });
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
            'isAdmin' => $isAdmin,
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
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        $maintenances = $drive->maintenances()
            ->when(!$isAdmin, function($query) use ($user) {
                $query->where(function($q) use ($user) {
                    $q->where('user_id', $user->id)  // Maintenances they created
                      ->orWhere('technician', $user->name); // Maintenances they're assigned to
                });
            })
            ->with('user:id,name')
            ->latest()
            ->get();
        
        return response()->json($maintenances);
    }

    /**
     * Export maintenance records for a specific drive to CSV.
     */
    public function exportForDrive(Drive $drive)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        // Get maintenance records for this specific drive
        $maintenances = $drive->maintenances()
            ->when(!$isAdmin, function($query) use ($user) {
                $query->where(function($q) use ($user) {
                    $q->where('user_id', $user->id)  // Maintenances they created
                      ->orWhere('technician', $user->name); // Maintenances they're assigned to
                });
            })
            ->with('user:id,name')
            ->latest()
            ->get();

        // Generate CSV content
        $csvData = [];
        
        // Add headers
        $csvData[] = [
            'ID',
            'Title',
            'Description',
            'Drive Name',
            'Drive Reference',
            'Maintenance Date',
            'Technician',
            'Status',
            'Cost',
            'Parts Replaced',
            'Created By',
            'Created At',
            'Updated At',
            'Total Tasks',
            'Completed Tasks',
            'Failed Tasks',
            'Task Notes'
        ];

        // Add data rows
        foreach ($maintenances as $maintenance) {
            // Parse checklist items to get task statistics
            $totalTasks = 0;
            $completedTasks = 0;
            $failedTasks = 0;
            $taskNotes = [];
            
            if ($maintenance->checklist_json) {
                try {
                    $checklist = is_string($maintenance->checklist_json) 
                        ? json_decode($maintenance->checklist_json, true) 
                        : $maintenance->checklist_json;
                    
                    if (is_array($checklist)) {
                        $totalTasks = count($checklist);
                        foreach ($checklist as $item) {
                            if (isset($item['status'])) {
                                if ($item['status'] === 'completed') {
                                    $completedTasks++;
                                } elseif ($item['status'] === 'failed') {
                                    $failedTasks++;
                                }
                            } elseif (isset($item['completed']) && $item['completed']) {
                                $completedTasks++;
                            }
                            
                            // Collect notes
                            if (isset($item['notes']) && !empty(trim($item['notes']))) {
                                $taskNotes[] = "Task: {$item['text']} - Notes: {$item['notes']}";
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // If JSON parsing fails, keep counts at 0
                }
            }

            // Format parts replaced
            $partsReplaced = '';
            if ($maintenance->parts_replaced && is_array($maintenance->parts_replaced)) {
                $partsReplaced = implode('; ', array_map(function($part) {
                    return is_array($part) ? ($part['name'] ?? $part['part_ref'] ?? 'Unknown Part') : $part;
                }, $maintenance->parts_replaced));
            }

            $csvData[] = [
                $maintenance->id,
                $maintenance->title,
                $maintenance->description ?? '',
                $drive->name,
                $drive->drive_ref,
                $maintenance->maintenance_date,
                $maintenance->technician ?? 'Not assigned',
                ucfirst(str_replace('_', ' ', $maintenance->status)),
                $maintenance->cost ? number_format($maintenance->cost, 2) : '0.00',
                $partsReplaced,
                $maintenance->user?->name ?? 'Unknown',
                $maintenance->created_at,
                $maintenance->updated_at,
                $totalTasks,
                $completedTasks,
                $failedTasks,
                implode(' | ', $taskNotes)
            ];
        }

        // Convert to CSV string
        $csvContent = '';
        foreach ($csvData as $row) {
            $csvContent .= implode(',', array_map(function($field) {
                // Escape fields that contain commas, quotes, or newlines
                if (strpos($field, ',') !== false || strpos($field, '"') !== false || strpos($field, "\n") !== false) {
                    return '"' . str_replace('"', '""', $field) . '"';
                }
                return $field;
            }, $row)) . "\n";
        }

        // Generate filename with drive name and timestamp
        $driveName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $drive->name);
        $filename = "maintenance_records_{$driveName}_{$drive->drive_ref}_" . date('Y-m-d_H-i-s') . '.csv';

        // Return CSV response
        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
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

    /**
     * Export maintenance records to CSV.
     */
    public function export(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        // Get maintenance records with the same filtering logic as the index method
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
            // Filter by user role - operators see maintenances they created OR are assigned to
            ->when(!$isAdmin, function($query) use ($user) {
                $query->where(function($q) use ($user) {
                    $q->where('user_id', $user->id)  // Maintenances they created
                      ->orWhere('technician', $user->name); // Maintenances they're assigned to
                });
            })
            ->latest()
            ->get();

        // Generate CSV content
        $csvData = [];
        
        // Add headers
        $csvData[] = [
            'ID',
            'Title',
            'Description',
            'Drive Name',
            'Drive Reference',
            'Maintenance Date',
            'Technician',
            'Status',
            'Cost',
            'Parts Replaced',
            'Created By',
            'Created At',
            'Updated At',
            'Total Tasks',
            'Completed Tasks',
            'Failed Tasks',
            'Task Notes'
        ];

        // Add data rows
        foreach ($maintenances as $maintenance) {
            // Parse checklist items to get task statistics
            $totalTasks = 0;
            $completedTasks = 0;
            $failedTasks = 0;
            $taskNotes = [];
            
            if ($maintenance->checklist_json) {
                try {
                    $checklist = is_string($maintenance->checklist_json) 
                        ? json_decode($maintenance->checklist_json, true) 
                        : $maintenance->checklist_json;
                    
                    if (is_array($checklist)) {
                        $totalTasks = count($checklist);
                        foreach ($checklist as $item) {
                            if (isset($item['status'])) {
                                if ($item['status'] === 'completed') {
                                    $completedTasks++;
                                } elseif ($item['status'] === 'failed') {
                                    $failedTasks++;
                                }
                            } elseif (isset($item['completed']) && $item['completed']) {
                                $completedTasks++;
                            }
                            
                            // Collect notes
                            if (isset($item['notes']) && !empty(trim($item['notes']))) {
                                $taskNotes[] = "Task: {$item['text']} - Notes: {$item['notes']}";
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // If JSON parsing fails, keep counts at 0
                }
            }

            // Format parts replaced
            $partsReplaced = '';
            if ($maintenance->parts_replaced && is_array($maintenance->parts_replaced)) {
                $partsReplaced = implode('; ', array_map(function($part) {
                    return is_array($part) ? ($part['name'] ?? $part['part_ref'] ?? 'Unknown Part') : $part;
                }, $maintenance->parts_replaced));
            }

            $csvData[] = [
                $maintenance->id,
                $maintenance->title,
                $maintenance->description ?? '',
                $maintenance->drive?->name ?? 'N/A',
                $maintenance->drive?->drive_ref ?? 'N/A',
                $maintenance->maintenance_date,
                $maintenance->technician ?? 'Not assigned',
                ucfirst(str_replace('_', ' ', $maintenance->status)),
                $maintenance->cost ? number_format($maintenance->cost, 2) : '0.00',
                $partsReplaced,
                $maintenance->user?->name ?? 'Unknown',
                $maintenance->created_at,
                $maintenance->updated_at,
                $totalTasks,
                $completedTasks,
                $failedTasks,
                implode(' | ', $taskNotes)
            ];
        }

        // Convert to CSV string
        $csvContent = '';
        foreach ($csvData as $row) {
            $csvContent .= implode(',', array_map(function($field) {
                // Escape fields that contain commas, quotes, or newlines
                if (strpos($field, ',') !== false || strpos($field, '"') !== false || strpos($field, "\n") !== false) {
                    return '"' . str_replace('"', '""', $field) . '"';
                }
                return $field;
            }, $row)) . "\n";
        }

        // Generate filename with timestamp
        $filename = 'maintenance_records_' . date('Y-m-d_H-i-s') . '.csv';

        // Return CSV response
        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
    }
}
