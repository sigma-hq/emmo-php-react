<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionTemplate;
use App\Models\InspectionTask;
use App\Models\InspectionTaskResult;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InspectionController extends Controller
{
    /**
     * Display a listing of inspections with filtering options.
     */
    public function index(Request $request)
    {
        $query = Inspection::with(['template', 'assignedUser', 'completedByUser']);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by assigned user
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('scheduled_date', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('scheduled_date', '<=', $request->end_date);
        }
        
        // Get inspections ordered by scheduled date
        $inspections = $query->orderBy('scheduled_date', 'desc')
            ->paginate($request->input('per_page', 15));
            
        return response()->json($inspections);
    }

    /**
     * Store a newly created inspection.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|exists:inspection_templates,id',
            'scheduled_date' => 'required|date',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            
            // Create the inspection
            $inspection = Inspection::create([
                'template_id' => $request->template_id,
                'status' => 'pending',
                'scheduled_date' => $request->scheduled_date,
                'assigned_to' => $request->assigned_to,
                'notes' => $request->notes,
            ]);
            
            DB::commit();
            
            return response()->json($inspection->load(['template', 'assignedUser']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create inspection', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified inspection with all task results.
     */
    public function show(int $id)
    {
        $inspection = Inspection::with([
                'template.tasks', 
                'taskResults.task', 
                'taskResults.recordedBy',
                'assignedUser',
                'completedByUser'
            ])
            ->findOrFail($id);
            
        return response()->json($inspection);
    }

    /**
     * Update the specified inspection.
     */
    public function update(Request $request, int $id)
    {
        $inspection = Inspection::findOrFail($id);
        
        // Only allow updates if not completed
        if ($inspection->status === 'completed' || $inspection->status === 'failed') {
            return response()->json([
                'error' => 'Cannot update a completed or failed inspection'
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'scheduled_date' => 'sometimes|required|date',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'status' => ['sometimes', Rule::in(['pending', 'in_progress'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $inspection->update($request->only([
                'scheduled_date',
                'assigned_to',
                'notes',
                'status'
            ]));
            
            return response()->json($inspection->load(['template', 'assignedUser']));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update inspection', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Record results for an inspection task.
     */
    public function recordTaskResult(Request $request, int $id, int $taskId)
    {
        $inspection = Inspection::findOrFail($id);
        $task = InspectionTask::findOrFail($taskId);
        
        // Ensure task belongs to the inspection's template
        if ($task->template_id !== $inspection->template_id) {
            return response()->json([
                'error' => 'Task does not belong to this inspection\'s template'
            ], 422);
        }
        
        // Only allow recording results if not completed
        if ($inspection->status === 'completed' || $inspection->status === 'failed') {
            return response()->json([
                'error' => 'Cannot record results for a completed or failed inspection'
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'value' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            
            // Update the inspection status to in_progress if it's pending
            if ($inspection->status === 'pending') {
                $inspection->update(['status' => 'in_progress']);
            }
            
            // Check if result already exists
            $result = InspectionTaskResult::where('inspection_id', $id)
                ->where('task_id', $taskId)
                ->first();
                
            $passed = $task->validateValue($request->value);
                
            if ($result) {
                // Update existing result
                $result->update([
                    'value' => $request->value,
                    'notes' => $request->notes,
                    'passed' => $passed,
                    'failure_reason' => (!$passed && $task->required) ? 'Failed validation' : null,
                    'recorded_by' => auth()->id(),
                ]);
            } else {
                // Create new result
                $result = InspectionTaskResult::create([
                    'inspection_id' => $id,
                    'task_id' => $taskId,
                    'value' => $request->value,
                    'notes' => $request->notes,
                    'passed' => $passed,
                    'failure_reason' => (!$passed && $task->required) ? 'Failed validation' : null,
                    'recorded_by' => auth()->id(),
                ]);
            }
            
            DB::commit();
            
            return response()->json($result->load(['task', 'recordedBy']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to record task result', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Complete an inspection.
     */
    public function complete(Request $request, int $id)
    {
        $inspection = Inspection::with('template.tasks')->findOrFail($id);
        
        // Only allow completing if in progress
        if ($inspection->status !== 'in_progress') {
            return response()->json([
                'error' => 'Can only complete inspections that are in progress'
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Get all task results
            $taskResults = InspectionTaskResult::where('inspection_id', $id)->get();
            $taskIds = $taskResults->pluck('task_id')->toArray();
            
            // Check for required tasks that don't have results
            $missingRequiredTasks = $inspection->template->tasks
                ->where('required', true)
                ->whereNotIn('id', $taskIds)
                ->pluck('name')
                ->toArray();
                
            if (!empty($missingRequiredTasks)) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Missing required tasks',
                    'missing_tasks' => $missingRequiredTasks
                ], 422);
            }
            
            // Check if any required tasks failed
            $failedRequiredTasks = $taskResults
                ->filter(function ($result) use ($inspection) {
                    $task = $inspection->template->tasks->firstWhere('id', $result->task_id);
                    return $task && $task->required && !$result->passed;
                })
                ->count() > 0;
                
            // Update inspection as completed or failed
            $inspection->update([
                'status' => $failedRequiredTasks ? 'failed' : 'completed',
                'completed_date' => Carbon::now(),
                'completed_by' => auth()->id(),
            ]);
            
            DB::commit();
            
            return response()->json($inspection->load(['template', 'taskResults', 'completedByUser']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to complete inspection', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate inspections based on templates and their frequency.
     * This would typically be called by a scheduled task.
     */
    public function generateScheduledInspections()
    {
        $today = Carbon::today();
        $count = 0;
        
        try {
            // Get templates that should generate inspections today
            $templates = InspectionTemplate::where(function ($query) use ($today) {
                // Templates with start date in the past or today
                $query->where('start_date', '<=', $today)
                    // And no end date or end date in the future
                    ->where(function ($q) use ($today) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', $today);
                    });
            })->get();
            
            foreach ($templates as $template) {
                $shouldCreate = false;
                
                // Check frequency to determine if we should create inspection today
                switch ($template->frequency) {
                    case 'daily':
                        $shouldCreate = true;
                        break;
                        
                    case 'weekly':
                        // Create on same day of week as start date
                        $startDayOfWeek = Carbon::parse($template->start_date)->dayOfWeek;
                        $shouldCreate = $today->dayOfWeek === $startDayOfWeek;
                        break;
                        
                    case 'monthly':
                        // Create on same day of month as start date
                        $startDay = Carbon::parse($template->start_date)->day;
                        $shouldCreate = $today->day === $startDay;
                        break;
                        
                    case 'one-time':
                        // For one-time, only create if start date is today and no inspection exists
                        $shouldCreate = $today->isSameDay($template->start_date) && 
                            !Inspection::where('template_id', $template->id)->exists();
                        break;
                }
                
                if ($shouldCreate) {
                    // Check if inspection already exists for today
                    $existingInspection = Inspection::where('template_id', $template->id)
                        ->whereDate('scheduled_date', $today)
                        ->exists();
                        
                    if (!$existingInspection) {
                        Inspection::create([
                            'template_id' => $template->id,
                            'status' => 'pending',
                            'scheduled_date' => $today,
                        ]);
                        $count++;
                    }
                }
            }
            
            return response()->json([
                'message' => "Generated $count new inspections",
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate scheduled inspections', 'message' => $e->getMessage()], 500);
        }
    }
} 