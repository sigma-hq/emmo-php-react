<?php

namespace App\Http\Controllers;

use App\Models\InspectionTemplate;
use App\Models\InspectionTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InspectionTemplateController extends Controller
{
    /**
     * Display a listing of the inspection templates.
     */
    public function index()
    {
        $templates = InspectionTemplate::with('creator')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($templates);
    }

    /**
     * Store a newly created inspection template.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency' => ['required', Rule::in(['one-time', 'daily', 'weekly', 'monthly'])],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'tasks' => 'required|array|min:1',
            'tasks.*.name' => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.validation_type' => ['required', Rule::in(['yes_no', 'numeric_range', 'visual_check', 'text_input'])],
            'tasks.*.expected_value' => 'nullable|string',
            'tasks.*.min_value' => 'nullable|string',
            'tasks.*.max_value' => 'nullable|string',
            'tasks.*.drive_id' => 'nullable|exists:drives,id',
            'tasks.*.part_id' => 'nullable|exists:parts,id',
            'tasks.*.required' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            
            $template = InspectionTemplate::create([
                'name' => $request->name,
                'description' => $request->description,
                'frequency' => $request->frequency,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'created_by' => auth()->id(),
            ]);
            
            foreach ($request->tasks as $index => $taskData) {
                InspectionTask::create([
                    'template_id' => $template->id,
                    'name' => $taskData['name'],
                    'description' => $taskData['description'] ?? null,
                    'validation_type' => $taskData['validation_type'],
                    'expected_value' => $taskData['expected_value'] ?? null,
                    'min_value' => $taskData['min_value'] ?? null,
                    'max_value' => $taskData['max_value'] ?? null,
                    'drive_id' => $taskData['drive_id'] ?? null,
                    'part_id' => $taskData['part_id'] ?? null,
                    'order' => $index,
                    'required' => $taskData['required'] ?? true,
                ]);
            }
            
            DB::commit();
            
            return response()->json($template->load(['tasks', 'creator']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create inspection template', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified inspection template.
     */
    public function show(int $id)
    {
        $template = InspectionTemplate::with(['tasks', 'creator'])
            ->findOrFail($id);
            
        return response()->json($template);
    }

    /**
     * Update the specified inspection template.
     */
    public function update(Request $request, int $id)
    {
        $template = InspectionTemplate::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'frequency' => ['sometimes', 'required', Rule::in(['one-time', 'daily', 'weekly', 'monthly'])],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'tasks' => 'sometimes|required|array|min:1',
            'tasks.*.id' => 'sometimes|exists:inspection_tasks,id',
            'tasks.*.name' => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.validation_type' => ['required', Rule::in(['yes_no', 'numeric_range', 'visual_check', 'text_input'])],
            'tasks.*.expected_value' => 'nullable|string',
            'tasks.*.min_value' => 'nullable|string',
            'tasks.*.max_value' => 'nullable|string',
            'tasks.*.drive_id' => 'nullable|exists:drives,id',
            'tasks.*.part_id' => 'nullable|exists:parts,id',
            'tasks.*.required' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            
            $template->update($request->only([
                'name', 
                'description', 
                'frequency', 
                'start_date', 
                'end_date'
            ]));
            
            if ($request->has('tasks')) {
                // Get existing task IDs
                $existingTaskIds = $template->tasks->pluck('id')->toArray();
                $updatedTaskIds = [];
                
                foreach ($request->tasks as $index => $taskData) {
                    if (isset($taskData['id'])) {
                        // Update existing task
                        $task = InspectionTask::findOrFail($taskData['id']);
                        $task->update([
                            'name' => $taskData['name'],
                            'description' => $taskData['description'] ?? null,
                            'validation_type' => $taskData['validation_type'],
                            'expected_value' => $taskData['expected_value'] ?? null,
                            'min_value' => $taskData['min_value'] ?? null,
                            'max_value' => $taskData['max_value'] ?? null,
                            'drive_id' => $taskData['drive_id'] ?? null,
                            'part_id' => $taskData['part_id'] ?? null,
                            'order' => $index,
                            'required' => $taskData['required'] ?? true,
                        ]);
                        $updatedTaskIds[] = $task->id;
                    } else {
                        // Create new task
                        $task = InspectionTask::create([
                            'template_id' => $template->id,
                            'name' => $taskData['name'],
                            'description' => $taskData['description'] ?? null,
                            'validation_type' => $taskData['validation_type'],
                            'expected_value' => $taskData['expected_value'] ?? null,
                            'min_value' => $taskData['min_value'] ?? null,
                            'max_value' => $taskData['max_value'] ?? null,
                            'drive_id' => $taskData['drive_id'] ?? null,
                            'part_id' => $taskData['part_id'] ?? null,
                            'order' => $index,
                            'required' => $taskData['required'] ?? true,
                        ]);
                        $updatedTaskIds[] = $task->id;
                    }
                }
                
                // Delete tasks that weren't updated or created
                $tasksToDelete = array_diff($existingTaskIds, $updatedTaskIds);
                if (!empty($tasksToDelete)) {
                    InspectionTask::whereIn('id', $tasksToDelete)->delete();
                }
            }
            
            DB::commit();
            
            return response()->json($template->load(['tasks', 'creator']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update inspection template', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified inspection template.
     */
    public function destroy(int $id)
    {
        $template = InspectionTemplate::findOrFail($id);
        
        try {
            // Check if the template has inspections
            if ($template->inspections()->exists()) {
                return response()->json([
                    'error' => 'Cannot delete template with associated inspections'
                ], 409);
            }
            
            DB::beginTransaction();
            
            // Delete associated tasks
            $template->tasks()->delete();
            
            // Delete the template
            $template->delete();
            
            DB::commit();
            
            return response()->json(null, 204);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to delete inspection template', 'message' => $e->getMessage()], 500);
        }
    }
} 