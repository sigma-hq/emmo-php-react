<?php

namespace App\Http\Controllers;

use App\Models\InspectionSubTask;
use App\Models\InspectionTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InspectionSubTaskController extends Controller
{
    /**
     * Store a newly created sub-task in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate(InspectionSubTask::validationRules());
            
            // Verify the parent task exists
            $task = InspectionTask::findOrFail($validated['inspection_task_id']);
            
            // Get the highest existing sort_order and add 1
            $maxSortOrder = InspectionSubTask::where('inspection_task_id', $task->id)
                ->max('sort_order') ?? -1;
            
            $validated['sort_order'] = $maxSortOrder + 1;
            
            // Initialize recorded values to null
            $validated['recorded_value_boolean'] = null;
            $validated['recorded_value_numeric'] = null;
            
            // Handle type-specific transformations
            if (isset($validated['type'])) {
                // Reset values not related to the selected type
                if ($validated['type'] === 'yes_no') {
                    $validated['expected_value_min'] = null;
                    $validated['expected_value_max'] = null;
                    $validated['unit_of_measure'] = null;
                } else if ($validated['type'] === 'numeric') {
                    $validated['expected_value_boolean'] = null;
                } else if ($validated['type'] === 'none') {
                    $validated['expected_value_boolean'] = null;
                    $validated['expected_value_min'] = null;
                    $validated['expected_value_max'] = null;
                    $validated['unit_of_measure'] = null;
                }
            }
            
            $subTask = InspectionSubTask::create($validated);
            
            // Get the inspection ID from the task for redirecting
            $inspectionId = $task->inspection_id;
            
            return redirect()->route('inspections.show', $inspectionId);
        } catch (\Exception $e) {
            Log::error('Failed to create sub-task: ' . $e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Failed to create sub-task: ' . $e->getMessage()]);
        }
    }

    /**
     * Update the specified sub-task in storage.
     */
    public function update(Request $request, InspectionSubTask $subTask)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'sometimes|required|in:yes_no,numeric,none',
                'expected_value_boolean' => 'nullable|boolean|required_if:type,yes_no',
                'expected_value_min' => 'nullable|numeric|required_if:type,numeric',
                'expected_value_max' => 'nullable|numeric|required_if:type,numeric',
                'unit_of_measure' => 'nullable|string|max:50|required_if:type,numeric',
                'sort_order' => 'nullable|integer',
            ]);
            
            // Handle type-specific transformations
            if (isset($validated['type'])) {
                // Reset values not related to the selected type
                if ($validated['type'] === 'yes_no') {
                    $validated['expected_value_min'] = null;
                    $validated['expected_value_max'] = null;
                    $validated['unit_of_measure'] = null;
                } else if ($validated['type'] === 'numeric') {
                    $validated['expected_value_boolean'] = null;
                } else if ($validated['type'] === 'none') {
                    $validated['expected_value_boolean'] = null;
                    $validated['expected_value_min'] = null;
                    $validated['expected_value_max'] = null;
                    $validated['unit_of_measure'] = null;
                }
            }
            
            $subTask->update($validated);
            
            // Get the task and inspection ID for redirecting
            $task = InspectionTask::findOrFail($subTask->inspection_task_id);
            $inspectionId = $task->inspection_id;
            
            return redirect()->route('inspections.show', $inspectionId);
        } catch (\Exception $e) {
            Log::error('Failed to update sub-task: ' . $e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Failed to update sub-task: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified sub-task from storage.
     */
    public function destroy(InspectionSubTask $subTask)
    {
        try {
            // Get the task and inspection ID for redirecting
            $task = InspectionTask::findOrFail($subTask->inspection_task_id);
            $inspectionId = $task->inspection_id;
            
            $subTask->delete();
            
            return redirect()->route('inspections.show', $inspectionId);
        } catch (\Exception $e) {
            Log::error('Failed to delete sub-task: ' . $e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Failed to delete sub-task: ' . $e->getMessage()]);
        }
    }

    /**
     * Toggle the completion status of a sub-task.
     */
    public function toggleStatus(InspectionSubTask $subTask)
    {
        try {
            if ($subTask->status === 'completed') {
                $success = $subTask->resetToPending();
                $message = 'Sub-task marked as pending';
            } else {
                $success = $subTask->complete(Auth::id());
                $message = 'Sub-task marked as completed';
            }
            
            if (!$success) {
                throw new \Exception('Failed to update sub-task status');
            }
            
            // Get the task and inspection ID for redirecting
            $task = InspectionTask::findOrFail($subTask->inspection_task_id);
            $inspectionId = $task->inspection_id;
            
            return redirect()->route('inspections.show', $inspectionId)
                ->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Failed to toggle sub-task status: ' . $e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Failed to update sub-task status: ' . $e->getMessage()]);
        }
    }

    /**
     * Reorder sub-tasks.
     */
    public function reorder(Request $request)
    {
        try {
            $validated = $request->validate([
                'task_id' => 'required|exists:inspection_tasks,id',
                'order' => 'required|array',
                'order.*' => 'required|exists:inspection_sub_tasks,id',
            ]);
            
            $taskId = $validated['task_id'];
            $orderIds = $validated['order'];
            
            // Verify all subtasks belong to the same task
            $count = InspectionSubTask::whereIn('id', $orderIds)
                ->where('inspection_task_id', $taskId)
                ->count();
                
            if ($count !== count($orderIds)) {
                return redirect()->back()->withErrors(['error' => 'All sub-tasks must belong to the same parent task']);
            }
            
            // Update the sort_order of each sub-task
            foreach ($orderIds as $index => $id) {
                InspectionSubTask::where('id', $id)->update(['sort_order' => $index]);
            }
            
            // Get the inspection ID for redirecting
            $task = InspectionTask::findOrFail($taskId);
            $inspectionId = $task->inspection_id;
            
            return redirect()->route('inspections.show', $inspectionId)
                ->with('success', 'Sub-tasks reordered successfully');
        } catch (\Exception $e) {
            Log::error('Failed to reorder sub-tasks: ' . $e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Failed to reorder sub-tasks: ' . $e->getMessage()]);
        }
    }

    /**
     * Record a result for a sub-task.
     */
    public function recordResult(Request $request, InspectionSubTask $subTask)
    {
        try {
            $validated = $request->validate([
                'value_boolean' => 'nullable|boolean|required_if:sub_task_type,yes_no',
                'value_numeric' => 'nullable|numeric|required_if:sub_task_type,numeric',
                'notes' => 'nullable|string',
                'sub_task_type' => 'required|in:yes_no,numeric,none',
            ]);
            
            $updateData = [];

            if ($validated['sub_task_type'] === 'none') {
                if ($subTask->status === 'completed') {
                    $subTask->resetToPending(); // This already nullifies recorded values
                } else {
                    $subTask->complete(Auth::id());
                    // For 'none' type, recorded values remain null
                    $updateData['recorded_value_boolean'] = null;
                    $updateData['recorded_value_numeric'] = null;
                }
                $message = 'Sub-task status updated';
            } else if ($validated['sub_task_type'] === 'yes_no') {
                $updateData['recorded_value_boolean'] = $validated['value_boolean'] ?? null;
                $updateData['recorded_value_numeric'] = null; // Ensure other type is null
                
                $isPassing = $subTask->isPassing($updateData['recorded_value_boolean'], null);
                if ($isPassing) {
                    $subTask->complete(Auth::id());
                    $message = 'Sub-task result recorded';
                } else {
                    $subTask->resetToPending(); // Or just set status, if resetToPending does too much
                    // Create maintenance record for failed sub-task
                    $maintenanceCreated = $this->createMaintenanceFromFailedSubTask($subTask, $validated['notes'] ?? null);
                    $message = $maintenanceCreated ? 'Sub-task failed - Maintenance record created automatically' : 'Sub-task result recorded';
                }
            } else if ($validated['sub_task_type'] === 'numeric') {
                $updateData['recorded_value_numeric'] = $validated['value_numeric'] ?? null;
                $updateData['recorded_value_boolean'] = null; // Ensure other type is null

                $isPassing = $subTask->isPassing(null, $updateData['recorded_value_numeric']);
                if ($isPassing) {
                    $subTask->complete(Auth::id());
                    $message = 'Sub-task result recorded';
                } else {
                    $subTask->resetToPending();
                    // Create maintenance record for failed sub-task
                    $maintenanceCreated = $this->createMaintenanceFromFailedSubTask($subTask, $validated['notes'] ?? null);
                    $message = $maintenanceCreated ? 'Sub-task failed - Maintenance record created automatically' : 'Sub-task result recorded';
                }
            }
            
            // Save the recorded values and notes
            $subTask->update(array_merge($updateData, [
                'notes' => $validated['notes'] ?? null
            ]));
            
            // Update inspection status based on all task and sub-task results
            $inspection = $task->inspection;
            if ($inspection) {
                $inspection->updateStatusBasedOnResults();
            }
            
            // Get the task and inspection ID for redirecting
            $task = InspectionTask::findOrFail($subTask->inspection_task_id);
            $inspectionId = $task->inspection_id;
            
            return redirect()->route('inspections.show', $inspectionId)
                ->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Failed to record sub-task result: ' . $e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Failed to record sub-task result: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Create a maintenance record when a sub-task fails
     */
    private function createMaintenanceFromFailedSubTask(InspectionSubTask $subTask, ?string $notes = null): bool
    {
        try {
            // Get the task and inspection
            $task = $subTask->task;
            $inspection = $task->inspection;
            
            if (!$task || !$inspection) {
                Log::warning('Cannot create maintenance: missing task or inspection', [
                    'sub_task_id' => $subTask->id,
                    'task_id' => $subTask->inspection_task_id,
                    'inspection_id' => $task?->inspection_id
                ]);
                return false;
            }
            
            // Get the target (drive or part)
            $target = $task->target;
            if (!$target) {
                Log::warning('Cannot create maintenance: no target found for task', [
                    'task_id' => $task->id,
                    'target_type' => $task->target_type,
                    'target_id' => $task->target_id
                ]);
                return false;
            }
            
            // Get drive information - we need a drive_id since it's required
            $drive = null;
            if ($task->target_type === 'drive') {
                $drive = \App\Models\Drive::find($task->target_id);
            } elseif ($task->target_type === 'part') {
                $part = \App\Models\Part::find($task->target_id);
                if ($part) {
                    $drive = $part->drive;
                }
            }

            // If no drive found, use a default drive
            if (!$drive) {
                $defaultDrive = \App\Models\Drive::first();
                if (!$defaultDrive) {
                    Log::error('Cannot create maintenance: no drives available in system', [
                        'sub_task_id' => $subTask->id,
                        'task_id' => $task->id,
                        'inspection_id' => $inspection->id
                    ]);
                    return false;
                }
                $drive = $defaultDrive;
            }
            
            // Check if maintenance already exists for this failed sub-task
            $existingMaintenance = \App\Models\Maintenance::where('inspection_id', $inspection->id)
                ->where('inspection_task_id', $task->id)
                ->where('created_from_inspection', true)
                ->first();
                
            if ($existingMaintenance) {
                Log::info('Maintenance already exists for this failed sub-task', [
                    'sub_task_id' => $subTask->id,
                    'maintenance_id' => $existingMaintenance->id
                ]);
                return false;
            }
            
            // Create maintenance record
            $maintenance = \App\Models\Maintenance::create([
                'drive_id' => $drive->id,
                'title' => "Maintenance Required - {$subTask->name}",
                'description' => "Automatic maintenance created due to failed inspection sub-task: {$subTask->name}. " .
                                "Task: {$task->name}. Inspection: {$inspection->name}. " .
                                ($notes ? "Notes: {$notes}" : ""),
                'maintenance_date' => now(),
                'status' => 'pending',
                'user_id' => Auth::id(),
                'created_from_inspection' => true,
                'inspection_id' => $inspection->id,
                'inspection_task_id' => $task->id,
                'inspection_result_id' => null, // We don't have a specific result ID for sub-tasks
                'checklist_json' => [
                    [
                        'id' => uniqid(),
                        'text' => "Review and fix: {$subTask->name}",
                        'status' => 'pending',
                        'notes' => $notes
                    ],
                    [
                        'id' => uniqid(),
                        'text' => "Verify inspection task: {$task->name}",
                        'status' => 'pending',
                        'notes' => null
                    ],
                    [
                        'id' => uniqid(),
                        'text' => "Re-run inspection after maintenance",
                        'status' => 'pending',
                        'notes' => null
                    ]
                ]
            ]);
            
            Log::info('Created maintenance from failed sub-task', [
                'sub_task_id' => $subTask->id,
                'task_id' => $task->id,
                'inspection_id' => $inspection->id,
                'maintenance_id' => $maintenance->id,
                'drive_id' => $task->target_id
            ]);
            
            // Update inspection status to failed if it's not already
            if ($inspection->status !== 'failed') {
                $inspection->update(['status' => 'failed']);
                Log::info('Updated inspection status to failed', [
                    'inspection_id' => $inspection->id,
                    'previous_status' => $inspection->getOriginal('status')
                ]);
            }
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to create maintenance from failed sub-task', [
                'sub_task_id' => $subTask->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Update recorded result for a sub-task.
     */
    public function updateResult(Request $request, InspectionSubTask $subTask)
    {
        try {
            $validated = $request->validate([
                'value_boolean' => 'nullable|boolean|required_if:sub_task_type,yes_no',
                'value_numeric' => 'nullable|numeric|required_if:sub_task_type,numeric',
                'notes' => 'nullable|string',
                'sub_task_type' => 'required|in:yes_no,numeric,none',
            ]);

            $updateData = [];

            if ($validated['sub_task_type'] === 'none') {
                // For 'none' type, we only update notes
                $updateData['recorded_value_boolean'] = null;
                $updateData['recorded_value_numeric'] = null;
            } else if ($validated['sub_task_type'] === 'yes_no') {
                $updateData['recorded_value_boolean'] = $validated['value_boolean'] ?? null;
                $updateData['recorded_value_numeric'] = null;
            } else if ($validated['sub_task_type'] === 'numeric') {
                $updateData['recorded_value_numeric'] = $validated['value_numeric'] ?? null;
                $updateData['recorded_value_boolean'] = null;
            }

            // Update the sub-task with new values and notes
            $subTask->update(array_merge($updateData, [
                'notes' => $validated['notes'] ?? null,
                'completed_at' => now(),
                'completed_by' => Auth::id()
            ]));

            // Update the inspection status
            $subTask->task->inspection->updateStatusBasedOnResults();

            // Check if this update creates a need for maintenance (if it's now failing)
            if ($validated['sub_task_type'] !== 'none') {
                $isPassing = $subTask->isPassing(
                    $updateData['recorded_value_boolean'] ?? null,
                    $updateData['recorded_value_numeric'] ?? null
                );
                
                if (!$isPassing) {
                    $this->createMaintenanceFromFailedSubTask($subTask, $validated['notes'] ?? null);
                }
            }

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Result updated successfully',
                    'sub_task' => $subTask->fresh()->load('completedBy')
                ]);
            }

            return redirect()->back()->with('success', 'Result updated successfully');

        } catch (\Exception $e) {
            Log::error('Failed to update sub-task result: ' . $e->getMessage(), [
                'sub_task_id' => $subTask->id,
                'request_data' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update result: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Failed to update result: ' . $e->getMessage()]);
        }
    }
}
