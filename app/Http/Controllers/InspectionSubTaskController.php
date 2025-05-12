<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
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
            
            $subTask = InspectionSubTask::create($validated);
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sub-task created successfully',
                    'sub_task' => $subTask->fresh()->load('completedBy'),
                ]);
            }
            
            // Get inspection ID from the task to redirect back
            $inspectionId = $task->inspection_id;
            
            return redirect()->route('api.inspections.show', $inspectionId)
                ->with('success', 'Sub-task created successfully');
            
        } catch (\Exception $e) {
            Log::error('Failed to create sub-task: ' . $e->getMessage());
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create sub-task',
                    'error' => $e->getMessage(),
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Failed to create sub-task: ' . $e->getMessage()]);
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
                'sort_order' => 'nullable|integer',
            ]);
            
            $subTask->update($validated);
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sub-task updated successfully',
                    'sub_task' => $subTask->fresh()->load('completedBy'),
                ]);
            }
            
            // Get inspection ID from the task to redirect back
            $inspectionId = $subTask->task->inspection_id;
            
            return redirect()->route('api.inspections.show', $inspectionId)
                ->with('success', 'Sub-task updated successfully');
            
        } catch (\Exception $e) {
            Log::error('Failed to update sub-task: ' . $e->getMessage());
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update sub-task',
                    'error' => $e->getMessage(),
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Failed to update sub-task: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified sub-task from storage.
     */
    public function destroy(Request $request, InspectionSubTask $subTask)
    {
        try {
            // Get inspection ID before deleting the task
            $inspectionId = $subTask->task->inspection_id;
            
            $subTask->delete();
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sub-task deleted successfully'
                ]);
            }
            
            return redirect()->route('api.inspections.show', $inspectionId)
                ->with('success', 'Sub-task deleted successfully');
            
        } catch (\Exception $e) {
            Log::error('Failed to delete sub-task: ' . $e->getMessage());
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete sub-task',
                    'error' => $e->getMessage(),
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Failed to delete sub-task: ' . $e->getMessage()]);
        }
    }

    /**
     * Toggle the completion status of a sub-task.
     */
    public function toggleStatus(Request $request, InspectionSubTask $subTask)
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
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'sub_task' => $subTask->fresh()->load('completedBy'),
                ]);
            }
            
            // Get inspection ID to redirect back
            $inspectionId = $subTask->task->inspection_id;
            
            return redirect()->route('api.inspections.show', $inspectionId)
                ->with('success', $message);
            
        } catch (\Exception $e) {
            Log::error('Failed to toggle sub-task status: ' . $e->getMessage());
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update sub-task status',
                    'error' => $e->getMessage(),
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Failed to update sub-task status: ' . $e->getMessage()]);
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
                if ($request->wantsJson() && !$request->header('X-Inertia')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'All sub-tasks must belong to the same parent task',
                    ], 400);
                }
                
                return back()->withErrors(['error' => 'All sub-tasks must belong to the same parent task']);
            }
            
            // Update the sort_order of each sub-task
            foreach ($orderIds as $index => $id) {
                InspectionSubTask::where('id', $id)->update(['sort_order' => $index]);
            }
            
            // Get inspection ID to redirect back
            $task = InspectionTask::findOrFail($taskId);
            $inspectionId = $task->inspection_id;
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sub-tasks reordered successfully',
                ]);
            }
            
            return redirect()->route('api.inspections.show', $inspectionId)
                ->with('success', 'Sub-tasks reordered successfully');
            
        } catch (\Exception $e) {
            Log::error('Failed to reorder sub-tasks: ' . $e->getMessage());
            
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to reorder sub-tasks',
                    'error' => $e->getMessage(),
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Failed to reorder sub-tasks: ' . $e->getMessage()]);
        }
    }
}
