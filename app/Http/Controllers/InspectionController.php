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
            'status' => ['required', Rule::in(['draft', 'active', 'completed', 'archived', 'failed'])],
            'operator_id' => ['nullable', 'exists:users,id'],
            // Scheduling fields (conditional validation)
            'is_template' => ['sometimes', 'boolean'],
            'schedule_frequency' => ['nullable', 'required_if:is_template,true', Rule::in(['minute', 'daily', 'weekly', 'monthly', 'yearly'])],
            'schedule_interval' => ['nullable', 'required_if:is_template,true', 'integer', 'min:1'],
            'schedule_start_date' => ['nullable', 'required_if:is_template,true', 'date'],
            'schedule_end_date' => ['nullable', 'date', 'after_or_equal:schedule_start_date'],
            // Expiry date field
            'expiry_date' => ['nullable', 'date', 'after:now'],
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

        $startDateCarbon = Carbon::parse($startDate);
        
        // If it's the first run (no lastCreated), start from the start date
        if (!$lastCreated) {
            // If start date is in the future, schedule for the start date
            if ($startDateCarbon->isFuture()) {
                return $startDateCarbon;
            }
            
            // For date-based frequencies, compare dates rather than exact timestamps
            $today = Carbon::today();
            $startDate = $startDateCarbon->copy()->startOfDay();
            
            // If start date is today or future, use the start date
            if ($startDate->greaterThanOrEqualTo($today)) {
                return $startDateCarbon;
            }
            
            // If start date is in the past, calculate the next occurrence from start date
            $nextDate = $startDateCarbon->copy();
            while ($nextDate->startOfDay()->lessThan($today)) {
                switch ($frequency) {
                    case 'minute': $nextDate->addMinutes($interval); break;
                    case 'daily': $nextDate->addDays($interval); break;
                    case 'weekly': $nextDate->addWeeks($interval); break;
                    case 'monthly': $nextDate->addMonths($interval); break;
                    case 'yearly': $nextDate->addYears($interval); break;
                }
            }
            return $nextDate;
        }
        
        // If it's not the first run, calculate based on the last creation date
        $lastCreatedCarbon = Carbon::parse($lastCreated);
        $nextDate = $lastCreatedCarbon->copy();
        
        switch ($frequency) {
            case 'minute': $nextDate->addMinutes($interval); break;
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
        
        $inspections = Inspection::with(['creator:id,name', 'operator:id,name', 'completedBy:id,name'])
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
            // Filter by user role - operators only see their assigned inspections
            ->when(!$isAdmin, function($query) use ($user) {
                $query->where('operator_id', $user->id);
            })
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function($query) {
                $query->whereHas('results', function($query) {
                    $query->where('is_passing', true);
                });
            }]);

        // Apply sorting: default to created_at (newest first) across all views, with optional 'priority'
        $sort = $request->input('sort', 'created_at_desc');

        if (in_array($sort, ['created_at_desc', 'created_at_asc', 'oldest'], true)) {
            $direction = in_array($sort, ['created_at_asc', 'oldest'], true) ? 'asc' : 'desc';
            $inspections = $inspections->reorder()->orderBy('created_at', $direction);
        } elseif ($sort === 'priority') {
            // Sort by priority using Laravel's query builder for database compatibility
            // First prioritize by expiry date, then by schedule due date, then newest
            $inspections = $inspections
                ->orderByRaw('CASE 
                    WHEN is_expired = 1 THEN 1
                    WHEN expiry_date IS NOT NULL AND expiry_date < ? THEN 2
                    WHEN expiry_date IS NOT NULL AND expiry_date <= ? THEN 3
                    WHEN expiry_date IS NOT NULL AND expiry_date <= ? THEN 4
                    WHEN schedule_next_due_date IS NULL THEN 7
                    WHEN schedule_next_due_date < ? THEN 5
                    WHEN schedule_next_due_date <= ? THEN 6
                    ELSE 7
                END', [
                    now(),
                    now()->addDay(),
                    now()->addDays(3),
                    now(),
                    now()->addDay()
                ])
                ->orderBy('expiry_date', 'asc')
                ->orderBy('schedule_next_due_date', 'asc')
                ->latest();
        } else {
            // Fallback to newest
            $inspections = $inspections->reorder()->orderBy('created_at', 'desc');
        }

        $inspections = $inspections
            ->paginate($perPage)
            ->withQueryString();
            
        // Get only operators for the operator dropdown
        $users = \App\Models\User::where('role', 'operator')->select('id', 'name')->orderBy('name')->get();
        
        // Add priority information to each inspection
        $inspections->getCollection()->transform(function ($inspection) {
            $inspection->priority_info = $inspection->getPriorityInfo();
            return $inspection;
        });
        
        // Calculate statistics from the database (not from paginated data)
        $statistics = [
            'total' => $isAdmin ? Inspection::count() : Inspection::where('operator_id', $user->id)->count(),
            'templates' => $isAdmin ? Inspection::where('is_template', true)->count() : 0, // Operators don't see templates
            'instances' => $isAdmin ? Inspection::where('is_template', false)->count() : Inspection::where('is_template', false)->where('operator_id', $user->id)->count(),
            'active' => $isAdmin ? Inspection::where('status', 'active')->count() : Inspection::where('status', 'active')->where('operator_id', $user->id)->count(),
            'draft' => $isAdmin ? Inspection::where('status', 'draft')->count() : Inspection::where('status', 'draft')->where('operator_id', $user->id)->count(),
            'completed' => $isAdmin ? Inspection::where('status', 'completed')->count() : Inspection::where('status', 'completed')->where('operator_id', $user->id)->count(),
            'failed' => $isAdmin ? Inspection::where('status', 'failed')->count() : Inspection::where('status', 'failed')->where('operator_id', $user->id)->count(),
            'archived' => $isAdmin ? Inspection::where('status', 'archived')->count() : Inspection::where('status', 'archived')->where('operator_id', $user->id)->count(),
        ];
            
        return Inertia::render('inspections', [
            'inspections' => $inspections,
            'users' => $users,
            'statistics' => $statistics,
            'filters' => [
                'search' => $request->input('search', ''),
                'type' => $request->input('type', 'all'),
                'status' => $request->input('status', 'all'),
                'per_page' => $perPage,
                'sort' => $sort
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
        
        // Set default status if not provided
        if (!isset($validated['status'])) {
            $validated['status'] = 'draft'; // Default status for new inspections
        }

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
            'operator:id,name',
            'completedBy:id,name',
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
        
        $oldStatus = $inspection->status;
        \Log::info("Inspection status update", [
            'inspection_id' => $inspection->id,
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
            'will_create_maintenance' => ($oldStatus !== 'failed' && $validated['status'] === 'failed')
        ]);
        
        $inspection->update($validated);
        
        // If status changed to 'failed', automatically create maintenance
        if ($oldStatus !== 'failed' && $validated['status'] === 'failed') {
            \Log::info("Creating maintenance from failed inspection", [
                'inspection_id' => $inspection->id,
                'inspection_name' => $inspection->name
            ]);
            $this->createMaintenanceFromFailedInspection($inspection);
        }
        
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

    /**
     * Create a maintenance record from a failed inspection.
     */
    private function createMaintenanceFromFailedInspection(Inspection $inspection): void
    {
        \Log::info("Starting maintenance creation for failed inspection", [
            'inspection_id' => $inspection->id,
            'inspection_name' => $inspection->name
        ]);
        
        // Get the target (drive or part) from the first task
        $firstTask = $inspection->tasks()->first();
        
        if (!$firstTask) {
            \Log::warning("No tasks found for inspection - creating generic maintenance", [
                'inspection_id' => $inspection->id
            ]);
            
            // Create a generic maintenance record without specific drive association
            $maintenance = \App\Models\Maintenance::create([
                'drive_id' => 1, // Default to first drive or we could make this nullable
                'title' => "Maintenance Required - {$inspection->name}",
                'description' => "Automatic maintenance created due to failed inspection: {$inspection->name}. This inspection had no specific drive/part tasks assigned.",
                'maintenance_date' => now(),
                'status' => 'pending',
                'user_id' => auth()->id(),
                'created_from_inspection' => true,
                'inspection_id' => $inspection->id,
                'checklist_json' => [
                    [
                        'id' => 1,
                        'task' => "Review and fix issues identified in inspection: {$inspection->name}",
                        'completed' => false,
                        'notes' => ''
                    ],
                    [
                        'id' => 2,
                        'task' => 'Verify all inspection criteria are met',
                        'completed' => false,
                        'notes' => ''
                    ],
                    [
                        'id' => 3,
                        'task' => 'Schedule follow-up inspection if required',
                        'completed' => false,
                        'notes' => ''
                    ],
                    [
                        'id' => 4,
                        'task' => 'Add specific tasks to this inspection for future reference',
                        'completed' => false,
                        'notes' => ''
                    ]
                ]
            ]);

            \Log::info("Created generic maintenance from failed inspection", [
                'inspection_id' => $inspection->id,
                'maintenance_id' => $maintenance->id
            ]);
            return;
        }

        $targetType = $firstTask->target_type; // 'drive' or 'part'
        $targetId = $firstTask->target_id;
        
        \Log::info("Task details for maintenance creation", [
            'inspection_id' => $inspection->id,
            'task_id' => $firstTask->id,
            'target_type' => $targetType,
            'target_id' => $targetId
        ]);
        
        // Get drive information based on target type
        $drive = null;
        $targetDescription = '';

        if ($targetType === 'drive') {
            $drive = \App\Models\Drive::find($targetId);
            if ($drive) {
                $targetDescription = "Drive: {$drive->name}";
            }
        } elseif ($targetType === 'part') {
            $part = \App\Models\Part::find($targetId);
            if ($part) {
                $drive = $part->drive;
                $targetDescription = "Part: {$part->name}" . ($drive ? " (Drive: {$drive->name})" : "");
            }
        }

        // Log maintenance creation attempt
        \Log::info("Creating maintenance record", [
            'inspection_id' => $inspection->id,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'drive_id' => $drive ? $drive->id : null,
            'drive_name' => $drive ? $drive->name : 'N/A'
        ]);
        
        // Create maintenance record
        $maintenance = \App\Models\Maintenance::create([
            'drive_id' => $drive ? $drive->id : null,
            'title' => "Maintenance Required - {$inspection->name}",
            'description' => "Automatic maintenance created due to failed inspection: {$inspection->name}. " .
                           ($targetDescription ? $targetDescription . ". " : "") .
                           "Please review and address all failed tasks.",
            'maintenance_date' => now(),
            'status' => 'pending',
            'user_id' => auth()->id(),
            'created_from_inspection' => true,
            'inspection_id' => $inspection->id,
            'checklist_json' => [
                [
                    'id' => 1,
                    'task' => "Review and fix issues identified in inspection: {$inspection->name}",
                    'completed' => false,
                    'notes' => ''
                ],
                [
                    'id' => 2,
                    'task' => 'Verify all inspection criteria are met',
                    'completed' => false,
                    'notes' => ''
                ],
                [
                    'id' => 3,
                    'task' => 'Schedule follow-up inspection if required',
                    'completed' => false,
                    'notes' => ''
                ]
            ]
        ]);

        \Log::info("Created maintenance from failed inspection", [
            'inspection_id' => $inspection->id,
            'maintenance_id' => $maintenance->id,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'drive_id' => $drive ? $drive->id : null,
            'drive_name' => $drive ? $drive->name : 'N/A'
        ]);
    }

    /**
     * Create a new inspection template with tasks and sub-tasks.
     */
    public function createTemplate(Request $request)
    {
        $user = auth()->user();
        
        // Check if user can manage inspections
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'operator_id' => 'nullable|exists:users,id',
            'schedule_frequency' => 'required|in:minute,daily,weekly,monthly,yearly',
            'schedule_interval' => 'required|integer|min:1',
            'schedule_start_date' => 'required|date',
            'schedule_end_date' => 'nullable|date|after_or_equal:schedule_start_date',
            'tasks' => 'required|array|min:1',
            'tasks.*.name' => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.type' => 'required|in:yes_no,numeric',
            'tasks.*.sub_tasks' => 'nullable|array',
            'tasks.*.sub_tasks.*.name' => 'required_with:tasks.*.sub_tasks|string|max:255',
            'tasks.*.sub_tasks.*.description' => 'nullable|string',
            'tasks.*.sub_tasks.*.sort_order' => 'nullable|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Calculate expiry date based on frequency and interval
            $expiryDate = $this->calculateExpiryDate(
                $request->schedule_frequency,
                $request->schedule_interval,
                $request->schedule_start_date
            );

            // Create the inspection template
            $inspection = Inspection::create([
                'name' => $request->name,
                'description' => $request->description,
                'status' => 'draft',
                'created_by' => $user->id,
                'operator_id' => $request->operator_id,
                'is_template' => true,
                'schedule_frequency' => $request->schedule_frequency,
                'schedule_interval' => $request->schedule_interval,
                'schedule_start_date' => $request->schedule_start_date,
                'schedule_end_date' => $request->schedule_end_date,
                'schedule_next_due_date' => $this->calculateNextDueDate(
                    $request->schedule_frequency,
                    $request->schedule_interval,
                    $request->schedule_start_date
                ),
                'expiry_date' => $expiryDate,
            ]);

            // Create tasks (sub-tasks removed from template creation)
            foreach ($request->tasks as $taskData) {
                $task = $inspection->tasks()->create([
                    'name' => $taskData['name'],
                    'description' => $taskData['description'],
                    'type' => $taskData['type'],
                    'expected_value_boolean' => $taskData['type'] === 'yes_no' ? ($taskData['expected_value_boolean'] ?? true) : null,
                    'expected_value_min' => $taskData['type'] === 'numeric' ? ($taskData['expected_value_min'] ?? null) : null,
                    'expected_value_max' => $taskData['type'] === 'numeric' ? ($taskData['expected_value_max'] ?? null) : null,
                    'unit_of_measure' => $taskData['type'] === 'numeric' ? ($taskData['unit_of_measure'] ?? null) : null,
                ]);
            }

            DB::commit();

            return redirect()->route('inspections')->with('success', 'Template created successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('inspections')->withErrors(['error' => 'Failed to create template: ' . $e->getMessage()]);
        }
    }

    /**
     * Upload CSV file to create inspection template.
     */
    public function uploadTemplateCsv(Request $request)
    {
        $user = auth()->user();
        
        // Check if user can manage inspections
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
            'operator_id' => 'nullable|exists:users,id',
        ]);

        try {
            $file = $request->file('csv_file');
            $csvData = array_map('str_getcsv', file($file->getPathname()));
            
            if (count($csvData) < 2) {
                return redirect()->route('inspections')->withErrors(['error' => 'CSV file must contain at least a header row and one data row']);
            }

            $headers = $csvData[0];
            $dataRows = array_slice($csvData, 1);

            // Process CSV data and create template
            $templateData = $this->parseCsvToTemplateData($headers, $dataRows);
            
            // Add operator_id if provided
            if ($request->has('operator_id') && $request->operator_id) {
                $templateData['operator_id'] = $request->operator_id;
            }
            
            // Create template using the existing method
            $request->merge($templateData);
            $result = $this->createTemplate($request);
            
            // If it's a redirect response, return it
            if ($result instanceof \Illuminate\Http\RedirectResponse) {
                return $result;
            }
            
            // Otherwise, redirect with success message
            return redirect()->route('inspections')->with('success', 'Template uploaded and created successfully');

        } catch (\Exception $e) {
            return redirect()->route('inspections')->withErrors(['error' => 'Failed to process CSV: ' . $e->getMessage()]);
        }
    }

    /**
     * Download CSV template for inspection templates.
     */
    public function downloadTemplateCsv()
    {
        $user = auth()->user();
        
        // Check if user can manage inspections
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="inspection_template.csv"',
        ];

        $callback = function() {
            $file = fopen('php://output', 'w');
            
            // CSV headers (sub-tasks removed)
            fputcsv($file, [
                'Template Name',
                'Description',
                'Schedule Frequency',
                'Schedule Interval',
                'Schedule End Date',
                'Task Name',
                'Task Description',
                'Task Type',
                'Expected Value (Yes/No)',
                'Minimum Value',
                'Maximum Value',
                'Unit of Measure'
            ]);
            
            // Note: Start Date and Operator fields are intentionally excluded from CSV
            // Start date will be filled during upload, operator will be assigned during upload

            // Example row
            fputcsv($file, [
                'Daily Drive Inspection',
                'Daily inspection checklist for drives',
                'daily',
                '1',
                '',
                'Check Drive Condition',
                'Inspect the overall condition of the drive',
                'yes_no',
                'true',
                '',
                '',
                ''
            ]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Calculate expiry date based on schedule frequency and interval.
     */
    private function calculateExpiryDate(string $frequency, int $interval, string $startDate): string
    {
        $start = \Carbon\Carbon::parse($startDate);
        
        switch ($frequency) {
            case 'daily':
                return $start->addDays($interval)->format('Y-m-d H:i:s');
            case 'weekly':
                return $start->addWeeks($interval)->format('Y-m-d H:i:s');
            case 'monthly':
                return $start->addMonths($interval)->format('Y-m-d H:i:s');
            case 'yearly':
                return $start->addYears($interval)->format('Y-m-d H:i:s');
            default:
                return $start->addDays($interval)->format('Y-m-d H:i:s');
        }
    }

    /**
     * Parse CSV data into template format.
     */
    private function parseCsvToTemplateData(array $headers, array $dataRows): array
    {
        // This is a simplified parser - you may want to enhance this based on your CSV structure
        $templateData = [
            'name' => '',
            'description' => '',
            'schedule_frequency' => 'daily',
            'schedule_interval' => 1,
            'schedule_start_date' => now()->format('Y-m-d'), // Default to today
            'schedule_end_date' => null,
            'tasks' => []
        ];

        $tasks = [];

        foreach ($dataRows as $row) {
            if (!empty($row[0])) { // Template name
                $templateData['name'] = $row[0];
            }
            if (!empty($row[1])) { // Description
                $templateData['description'] = $row[1];
            }
            if (!empty($row[2])) { // Schedule frequency
                $templateData['schedule_frequency'] = $row[2];
            }
            if (!empty($row[3])) { // Schedule interval
                $templateData['schedule_interval'] = (int) $row[3];
            }
            if (!empty($row[4])) { // Schedule end date
                $templateData['schedule_end_date'] = $row[4];
            }

            // Process task data (no sub-tasks in CSV)
            if (!empty($row[5])) { // Task name
                $taskData = [
                    'name' => $row[5],
                    'description' => $row[6] ?? '',
                    'type' => $row[7] ?? 'yes_no',
                    'expected_value_boolean' => ($row[8] ?? 'true') === 'true'
                ];
                
                // Add numeric values if they exist in the CSV
                if (isset($row[9]) && !empty($row[9])) { // Minimum Value
                    $taskData['expected_value_min'] = is_numeric($row[9]) ? (float) $row[9] : $row[9];
                }
                if (isset($row[10]) && !empty($row[10])) { // Maximum Value
                    $taskData['expected_value_max'] = is_numeric($row[10]) ? (float) $row[10] : $row[10];
                }
                if (isset($row[11]) && !empty($row[11])) { // Unit of Measure
                    $taskData['unit_of_measure'] = $row[11];
                }
                
                $tasks[] = $taskData;
            }
        }

        $templateData['tasks'] = $tasks;

        return $templateData;
    }
}
