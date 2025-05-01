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
            
            return redirect()->route('api.inspections.show', $validated['inspection_id'])
                ->with('success', 'Task added successfully');
        } catch (\Exception $e) {
            Log::error('InspectionTask store - error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
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
            
            return redirect()->route('api.inspections.show', $task->inspection_id)
                ->with('success', 'Task updated successfully');
        } catch (\Exception $e) {
            Log::error('InspectionTask update - error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
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
