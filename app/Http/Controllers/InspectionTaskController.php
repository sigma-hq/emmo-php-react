<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionTask;
use App\Models\InspectionResult;
use Illuminate\Http\Request;

class InspectionTaskController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate(InspectionTask::validationRules());
        
        $task = InspectionTask::create($validated);
        
        return redirect()->route('api.inspections.show', $validated['inspection_id'])
            ->with('success', 'Task added successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InspectionTask $task)
    {
        $validated = $request->validate(InspectionTask::validationRules());
        
        $task->update($validated);
        
        return redirect()->route('api.inspections.show', $task->inspection_id)
            ->with('success', 'Task updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(InspectionTask $task)
    {
        $inspectionId = $task->inspection_id;
        $task->delete();
        
        return redirect()->route('api.inspections.show', $inspectionId)
            ->with('success', 'Task deleted successfully');
    }
    
    /**
     * Record a result for an inspection task.
     */
    public function recordResult(Request $request, InspectionTask $task)
    {
        $validated = $request->validate([
            'value_boolean' => 'nullable|boolean|required_if:task_type,yes_no',
            'value_numeric' => 'nullable|numeric|required_if:task_type,numeric',
            'notes' => 'nullable|string',
            'task_type' => 'required|in:yes_no,numeric',
        ]);
        
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
        
        return redirect()->route('api.inspections.show', $task->inspection_id)
            ->with('success', 'Result recorded successfully');
    }
}
