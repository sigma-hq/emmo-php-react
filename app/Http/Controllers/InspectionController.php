<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Inspection;
use App\Models\Part;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InspectionController extends Controller
{
    /**
     * Define validation rules for storing/updating inspections.
     */
    protected function validationRules(bool $isUpdate = false, ?int $inspectionId = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['draft', 'active', 'completed', 'archived'])],
            'operator_id' => ['nullable', 'exists:users,id'],
            // Scheduling fields (conditional validation)
            'is_template' => ['sometimes', 'boolean'],
            'schedule_frequency' => ['nullable', 'required_if:is_template,true', Rule::in(['daily', 'weekly', 'monthly', 'yearly'])],
            'schedule_interval' => ['nullable', 'required_if:is_template,true', 'integer', 'min:1'],
            'schedule_start_date' => ['nullable', 'required_if:is_template,true', 'date'],
            'schedule_end_date' => ['nullable', 'date', 'after_or_equal:schedule_start_date'],
        ];
    }
    
    /**
     * Calculate the next due date based on schedule settings.
     */
    protected function calculateNextDueDate(?string $frequency, ?int $interval, ?string $startDate, ?string $lastCreated = null): ?Carbon
    {
        if (!$frequency || !$interval || !$startDate) {
            return null;
        }

        $current = $lastCreated ? Carbon::parse($lastCreated) : Carbon::parse($startDate);
        $startDateCarbon = Carbon::parse($startDate);

        // Ensure the starting point is at least the schedule_start_date
        if ($current->lt($startDateCarbon)) {
            $current = $startDateCarbon;
        }
        
        // If it's the first run (no lastCreated) and start date is in the future, schedule for the start date
        if (!$lastCreated && $current->isFuture()) {
            return $current; 
        }

        // If it's the first run and start date is in the past/today, calculate the next occurrence *from* the start date
        // that is >= today
        if (!$lastCreated) {
            $nextDate = $startDateCarbon;
            while ($nextDate->isPast()) {
                switch ($frequency) {
                    case 'daily': $nextDate->addDays($interval); break;
                    case 'weekly': $nextDate->addWeeks($interval); break;
                    case 'monthly': $nextDate->addMonths($interval); break;
                    case 'yearly': $nextDate->addYears($interval); break;
                }
            }
            return $nextDate;
        }
        
        // If it's not the first run, calculate based on the last creation date
        $nextDate = $current;
        switch ($frequency) {
            case 'daily': $nextDate->addDays($interval); break;
            case 'weekly': $nextDate->addWeeks($interval); break;
            case 'monthly': $nextDate->addMonths($interval); break;
            case 'yearly': $nextDate->addYears($interval); break;
        }
        
        return $nextDate;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        // Get pagination settings from request or use defaults
        $perPage = $request->input('per_page', 10);
        
        $inspections = Inspection::with(['creator:id,name', 'operator:id,name'])
            ->when($request->input('search'), function($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            // Add filtering for templates/instances via request param
            ->when($request->input('type'), function($query, $type) {
                if ($type === 'templates') $query->where('is_template', true);
                if ($type === 'instances') $query->where('is_template', false);
            })
            // Add filtering for status
            ->when($request->input('status') && $request->input('status') !== 'all', function($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function($query) {
                $query->whereHas('results', function($query) {
                    $query->where('is_passing', true);
                });
            }])
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
            
        // Get all users for the operator dropdown
        $users = \App\Models\User::select('id', 'name')->orderBy('name')->get();
            
        return Inertia::render('inspections', [
            'inspections' => $inspections,
            'users' => $users,
            'filters' => [
                'search' => $request->input('search', ''),
                'type' => $request->input('type', 'all'),
                'status' => $request->input('status', 'all'),
                'per_page' => $perPage
            ],
            'isAdmin' => $isAdmin
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate($this->validationRules());
        
        $validated['created_by'] = auth()->id();
        $validated['is_template'] = $request->boolean('is_template');

        // Clear schedule fields if not a template
        if (!$validated['is_template']) {
            $validated['schedule_frequency'] = null;
            $validated['schedule_interval'] = null;
            $validated['schedule_start_date'] = null;
            $validated['schedule_end_date'] = null;
            $validated['schedule_next_due_date'] = null;
            $validated['schedule_last_created_at'] = null;
        } else {
            // Calculate initial next due date for templates
            $validated['schedule_next_due_date'] = $this->calculateNextDueDate(
                $validated['schedule_frequency'] ?? null,
                $validated['schedule_interval'] ?? null,
                $validated['schedule_start_date'] ?? null
            );
            $validated['schedule_last_created_at'] = null; // Ensure null on creation
        }
        
        $inspection = Inspection::create($validated);
        
        return redirect()->route('inspections')->with('success', 'Inspection created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Inspection $inspection)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        $inspection->load([
            'creator:id,name',
            'parentTemplate:id,name', // Load parent if it's an instance
            'tasks' => function($query) {
                $query->with([
                    'results' => function($query) {
                    $query->with('performer:id,name');
                    },
                    'subTasks' => function($query) {
                        $query->with('completedBy:id,name')->orderBy('sort_order');
                    }
                ])->addSelect(['*', 
                  DB::raw('(CASE 
                      WHEN target_type = "drive" THEN (SELECT drive_ref FROM drives WHERE drives.id = target_id) 
                      ELSE NULL 
                    END) as target_drive_ref'),
                  DB::raw('(CASE 
                      WHEN target_type = "part" THEN (SELECT part_ref FROM parts WHERE parts.id = target_id) 
                      ELSE NULL 
                    END) as target_part_ref')
                ]);
            }
        ]);
        
        // Improve debugging
        $response = [
            'inspection' => $inspection,
            'drives' => Drive::select('id', 'name', 'drive_ref')->get(),
            'parts' => Part::select('id', 'name', 'part_ref')->get(),
            'isAdmin' => $isAdmin,
        ];
        
        // Force relationship to be included in response
        foreach ($inspection->tasks as $task) {
            // Explicitly load the subTasks to ensure they're in the response
            $task->setRelation('subTasks', $task->subTasks()->with('completedBy:id,name')->orderBy('sort_order')->get());
        }
        
        return Inertia::render('inspection/show', $response);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Inspection $inspection)
    {
        $validated = $request->validate($this->validationRules(true, $inspection->id));

        $validated['is_template'] = $request->boolean('is_template');

        // Logic to handle changes between template/non-template and schedule updates
        $isCurrentlyTemplate = $inspection->is_template;
        $willBeTemplate = $validated['is_template'];

        if (!$willBeTemplate) {
            // Becoming (or staying) a non-template
            $validated['schedule_frequency'] = null;
            $validated['schedule_interval'] = null;
            $validated['schedule_start_date'] = null;
            $validated['schedule_end_date'] = null;
            $validated['schedule_next_due_date'] = null;
            $validated['schedule_last_created_at'] = null;
            $validated['parent_inspection_id'] = $validated['parent_inspection_id'] ?? $inspection->parent_inspection_id; // Keep parent if exists
        } else {
            // Becoming (or staying) a template
            $validated['parent_inspection_id'] = null; // Templates cannot have parents

            // Recalculate next due date if schedule changes or if it became a template
            $scheduleChanged = $validated['schedule_frequency'] !== $inspection->schedule_frequency ||
                               $validated['schedule_interval'] !== $inspection->schedule_interval ||
                               $validated['schedule_start_date'] !== ($inspection->schedule_start_date ? $inspection->schedule_start_date->format('Y-m-d H:i:s') : null);
            
            if (!$isCurrentlyTemplate || $scheduleChanged) {
                 // Use current last_created_at if schedule changed but it was already a template
                 $lastCreatedAt = $isCurrentlyTemplate && $scheduleChanged ? $inspection->schedule_last_created_at : null;
                 $validated['schedule_next_due_date'] = $this->calculateNextDueDate(
                    $validated['schedule_frequency'] ?? null,
                    $validated['schedule_interval'] ?? null,
                    $validated['schedule_start_date'] ?? null,
                    $lastCreatedAt?->format('Y-m-d H:i:s')
                );
                 // If converting to template, reset last created at
                 if (!$isCurrentlyTemplate) {
                     $validated['schedule_last_created_at'] = null;
                 }
            } else {
                // Keep existing dates if schedule didn't change
                 $validated['schedule_next_due_date'] = $inspection->schedule_next_due_date;
                 $validated['schedule_last_created_at'] = $inspection->schedule_last_created_at;
            }
             // Ensure end date is null if empty string is passed
             if (empty($validated['schedule_end_date'])) {
                $validated['schedule_end_date'] = null;
             }
        }
        
        $inspection->update($validated);
        
        // Use inspection detail route if available, otherwise fallback
        $routeName = $inspection->is_template ? 'inspections' : 'inspections.show';
        $routeParams = $inspection->is_template ? [] : ['inspection' => $inspection->id];
        
        return redirect()->route($routeName, $routeParams)->with('success', 'Inspection updated successfully');

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Inspection $inspection)
    {
        // If deleting a template, consider deleting instances? Or orphan them?
        // Current: Cascading delete handled by DB constraint if desired.
        $inspection->delete();
        
        return redirect()->route('inspections')->with('success', 'Inspection deleted successfully');
    }
}
