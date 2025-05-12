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
                'sort_order' => 'nullable|integer',
            ]);
            
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
}
