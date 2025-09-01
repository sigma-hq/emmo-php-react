<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionTask;
use App\Models\InspectionResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InspectionTaskController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            Log::info('InspectionTask store - request data:', $request->all());
            
            $validated = $request->validate(InspectionTask::validationRules());
            
            // Handle 'none' value for target_type
            if (isset($validated['target_type']) && $validated['target_type'] === 'none') {
                $validated['target_type'] = null;
                $validated['target_id'] = null;
            }
            
            // Convert expected_value_boolean from string to actual boolean
            if (isset($validated['type']) && $validated['type'] === 'yes_no' && isset($validated['expected_value_boolean'])) {
                $validated['expected_value_boolean'] = filter_var(
                    $validated['expected_value_boolean'], 
                    FILTER_VALIDATE_BOOLEAN
                );
            }
            
            // Handle numeric values
            if (isset($validated['type']) && $validated['type'] === 'numeric') {
                // Convert empty strings to null
                if (isset($validated['expected_value_min']) && $validated['expected_value_min'] === '') {
                    $validated['expected_value_min'] = null;
                }
                if (isset($validated['expected_value_max']) && $validated['expected_value_max'] === '') {
                    $validated['expected_value_max'] = null;
                }
            }
            
            Log::info('InspectionTask store - processed data:', $validated);
            
            $task = InspectionTask::create($validated);
            
            Log::info('InspectionTask store - task created:', ['id' => $task->id]);
            
            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                return redirect()->route('inspections.show', $validated['inspection_id'])
                    ->with('success', 'Task added successfully');
            }
            
            // For Ajax/JSON requests
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Task added successfully',
                    'task' => $task->fresh()->load(['results.performer', 'subTasks.completedBy'])
                ]);
            }
            
            return redirect()->route('inspections.show', $validated['inspection_id'])
                ->with('success', 'Task added successfully');
        } catch (\Exception $e) {
            Log::error('InspectionTask store - error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to add task',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            throw $e;
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InspectionTask $task)
    {
        try {
            Log::info('InspectionTask update - request data:', $request->all());
            
            $validated = $request->validate(InspectionTask::validationRules());
            
            // Handle 'none' value for target_type
            if (isset($validated['target_type']) && $validated['target_type'] === 'none') {
                $validated['target_type'] = null;
                $validated['target_id'] = null;
            }
            
            // Convert expected_value_boolean from string to actual boolean
            if (isset($validated['type']) && $validated['type'] === 'yes_no' && isset($validated['expected_value_boolean'])) {
                $validated['expected_value_boolean'] = filter_var(
                    $validated['expected_value_boolean'], 
                    FILTER_VALIDATE_BOOLEAN
                );
            }
            
            // Handle numeric values
            if (isset($validated['type']) && $validated['type'] === 'numeric') {
                // Convert empty strings to null
                if (isset($validated['expected_value_min']) && $validated['expected_value_min'] === '') {
                    $validated['expected_value_min'] = null;
                }
                if (isset($validated['expected_value_max']) && $validated['expected_value_max'] === '') {
                    $validated['expected_value_max'] = null;
                }
            }
            
            Log::info('InspectionTask update - processed data:', $validated);
            
            $task->update($validated);
            
            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                return redirect()->route('inspections.show', $task->inspection_id)
                    ->with('success', 'Task updated successfully');
            }
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Task updated successfully',
                    'task' => $task->fresh()->load(['results.performer', 'subTasks.completedBy'])
                ]);
            }
            
            return redirect()->route('inspections.show', $task->inspection_id)
                ->with('success', 'Task updated successfully');
        } catch (\Exception $e) {
            Log::error('InspectionTask update - error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update task',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, InspectionTask $task)
    {
        try {
            $inspectionId = $task->inspection_id;
            $task->delete();
            
            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                return redirect()->route('inspections.show', $inspectionId)
                    ->with('success', 'Task deleted successfully');
            }
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Task deleted successfully'
                ]);
            }
            
            return redirect()->route('inspections.show', $inspectionId)
                ->with('success', 'Task deleted successfully');
        } catch (\Exception $e) {
            Log::error('InspectionTask destroy - error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete task',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            throw $e;
        }
    }
    
    /**
     * Record a result for an inspection task.
     */
    public function recordResult(Request $request, InspectionTask $task)
    {
        try {
            // Get validation rules based on task type
            $validationRules = [
                'notes' => 'nullable|string'
            ];

            if ($task->type === 'yes_no') {
                $validationRules['value_boolean'] = 'required|boolean';
                $validationRules['value_numeric'] = 'nullable';
            } else if ($task->type === 'numeric') {
                $validationRules['value_numeric'] = 'required|numeric';
                $validationRules['value_boolean'] = 'nullable';
            }

            $validated = $request->validate($validationRules);
            
            // Check if all subtasks are completed
            $subtasks = $task->subTasks;
            if ($subtasks->count() > 0) {
                $pendingSubtasks = $subtasks->where('status', '!=', 'completed')->count();
                
                if ($pendingSubtasks > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot record result: ' . $pendingSubtasks . ' subtask(s) are not completed',
                        'pending_count' => $pendingSubtasks
                    ], 422);
                }
            }
        
            // Determine if the result is passing
            $isPassing = $task->isPassing(
                $validated['value_boolean'] ?? null,
                $validated['value_numeric'] ?? null
            );
        
            $result = new InspectionResult([
                'inspection_id' => $task->inspection_id,
                'task_id' => $task->id,
                'performed_by' => auth()->id(),
                'value_boolean' => $validated['value_boolean'],
                'value_numeric' => $validated['value_numeric'],
                'is_passing' => $isPassing,
                'notes' => $validated['notes'],
            ]);
        
            $result->save();
            
            // Update inspection status based on all task and sub-task results
            $inspection = $task->inspection;
            if ($inspection) {
                $inspection->updateStatusBasedOnResults();
            }
            
            // If the result failed, automatically create a maintenance record
            if (!$isPassing) {
                \Log::info('Task failed, creating maintenance record', [
                    'task_id' => $task->id,
                    'task_name' => $task->name,
                    'inspection_id' => $task->inspection_id,
                    'result_id' => $result->id,
                    'is_passing' => $isPassing
                ]);
                $this->createMaintenanceFromFailedInspection($task, $result);
            }
            
            // Determine success message based on result
            $message = $isPassing ? 'Result recorded successfully' : 'Task failed - Maintenance record created automatically';
            
            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                return redirect()->route('inspections.show', $task->inspection_id)
                    ->with('success', $message);
            }
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'result' => $result->fresh()->load('performer')
                ]);
            }
            
            return redirect()->route('inspections.show', $task->inspection_id)
                ->with('success', $message);
        } catch (\Exception $e) {
            Log::error('InspectionTask recordResult - error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to record result',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            throw $e;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(InspectionTask $task)
    {
        // Load target reference details if applicable
        if ($task->target_type === 'drive') {
            $task->load('target:id,drive_ref');
        } elseif ($task->target_type === 'part') {
            $task->load('target:id,part_ref');
        }
        
        return response()->json([
            'success' => true,
            'task' => $task->load(['results.performer', 'subTasks.completedBy']),
        ]);
    }

    /**
     * Create a maintenance record from a failed inspection result.
     */
    private function createMaintenanceFromFailedInspection(InspectionTask $task, InspectionResult $result): void
    {
        try {
            // Get the inspection
            $inspection = $task->inspection;
            if (!$inspection) {
                \Log::error('Cannot create maintenance: no inspection found for task', [
                    'task_id' => $task->id
                ]);
                return;
            }

            // Get drive information based on target type
            $drive = null;
            $targetDescription = '';

            if ($task->target_type === 'drive') {
                $drive = \App\Models\Drive::find($task->target_id);
                if ($drive) {
                    $targetDescription = "Drive: {$drive->name}";
                }
            } elseif ($task->target_type === 'part') {
                $part = \App\Models\Part::find($task->target_id);
                if ($part) {
                    $drive = $part->drive;
                    $targetDescription = "Part: {$part->name}" . ($drive ? " (Drive: {$drive->name})" : "");
                }
            }

            // Create maintenance record - we need a drive_id, so use a default if none found
            if (!$drive) {
                // Get the first available drive as a fallback
                $defaultDrive = \App\Models\Drive::first();
                if (!$defaultDrive) {
                    \Log::error('Cannot create maintenance: no drives available in system', [
                        'task_id' => $task->id,
                        'inspection_id' => $inspection->id
                    ]);
                    return;
                }
                $drive = $defaultDrive;
                $targetDescription = "Default Drive: {$drive->name} (No specific drive associated with task)";
            }

            $maintenanceData = [
                'drive_id' => $drive->id, // Always set a drive_id since it's required
                'title' => "Maintenance Required: {$task->name}",
                'description' => "Automatic maintenance created due to failed inspection task: {$task->name}. " .
                                ($targetDescription ? $targetDescription . ". " : "") .
                                "Task: {$task->description}. " .
                                "Result: " . ($result->value_boolean !== null ? 
                                    ($result->value_boolean ? 'Yes' : 'No') : 
                                    $result->value_numeric) .
                                ($result->notes ? " Notes: {$result->notes}" : ''),
                'maintenance_date' => now(),
                'status' => 'pending',
                'user_id' => auth()->id(),
                'created_from_inspection' => true,
                'inspection_id' => $inspection->id,
                'inspection_task_id' => $task->id,
                'inspection_result_id' => $result->id,
            ];

            \Log::info('Attempting to create maintenance record with data:', $maintenanceData);

            $maintenance = \App\Models\Maintenance::create($maintenanceData);
            
            \Log::info('Maintenance created from failed inspection', [
                'maintenance_id' => $maintenance->id,
                'inspection_id' => $inspection->id,
                'task_id' => $task->id,
                'result_id' => $result->id,
                'drive_id' => $drive ? $drive->id : null,
                'target_type' => $task->target_type,
                'target_id' => $task->target_id
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to create maintenance from inspection failure', [
                'error' => $e->getMessage(),
                'task_id' => $task->id,
                'result_id' => $result->id,
                'target_type' => $task->target_type,
                'target_id' => $task->target_id
            ]);
        }
    }
}
