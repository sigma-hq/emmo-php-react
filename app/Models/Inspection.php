<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inspection extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'status',
        'created_by',
        'operator_id',
        'completed_by',
        // Scheduling related fields
        'is_template',
        'parent_inspection_id',
        'unique_constraint',
        'schedule_frequency',
        'schedule_interval',
        'schedule_start_date',
        'schedule_end_date',
        'schedule_next_due_date',
        'schedule_last_created_at',
        // Expiry and performance tracking fields
        'expiry_date',
        'is_expired',
        'expired_at',
        'performance_penalty'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_template' => 'boolean',
        'schedule_start_date' => 'datetime',
        'schedule_end_date' => 'datetime',
        'schedule_next_due_date' => 'datetime',
        'schedule_last_created_at' => 'datetime',
        'expiry_date' => 'datetime',
        'expired_at' => 'datetime',
        'is_expired' => 'boolean',
        'performance_penalty' => 'integer',
    ];

    /**
     * Get the user who created this inspection.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the operator assigned to this inspection.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    /**
     * Get the operator who completed this inspection.
     */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Get the tasks belonging to this inspection.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(InspectionTask::class);
    }

    /**
     * Get the results belonging to this inspection.
     */
    public function results(): HasMany
    {
        return $this->hasMany(InspectionResult::class);
    }

    /**
     * Calculate the priority level based on expiration date
     */
    public function getPriorityLevel(): string
    {
        // First check if inspection has expired
        if ($this->is_expired) {
            return 'expired';
        }

        // Check individual inspection expiry date first
        if ($this->expiry_date) {
            $now = now();
            $expiryDate = $this->expiry_date;
            $daysUntilExpiry = $now->diffInDays($expiryDate, false);

            if ($daysUntilExpiry < 0) {
                return 'expired';
            } elseif ($daysUntilExpiry <= 1) {
                return 'critical';
            } elseif ($daysUntilExpiry <= 3) {
                return 'high';
            } elseif ($daysUntilExpiry <= 7) {
                return 'medium';
            } else {
                return 'low';
            }
        }

        // Fall back to schedule-based priority if no expiry date
        if ($this->schedule_next_due_date) {
            $now = now();
            $dueDate = $this->schedule_next_due_date;
            $daysUntilDue = $now->diffInDays($dueDate, false);

            if ($daysUntilDue < 0) {
                return 'overdue';
            } elseif ($daysUntilDue <= 1) {
                return 'high';
            } elseif ($daysUntilDue <= 3) {
                return 'medium';
            } elseif ($daysUntilDue <= 7) {
                return 'low';
            }
        }

        return 'no_urgency';
    }

    /**
     * Get priority display information
     */
    public function getPriorityInfo(): array
    {
        $priority = $this->getPriorityLevel();
        
        // Determine which date to use for priority calculation
        $dueDate = $this->expiry_date ?? $this->schedule_next_due_date;
        
        if (!$dueDate) {
            return [
                'level' => 'no_urgency',
                'label' => 'No Due Date',
                'color' => 'gray',
                'icon' => 'circle',
                'urgency' => 'none',
                'days_until_due' => null,
                'is_overdue' => false,
                'due_date' => null,
                'formatted_due_date' => null,
                'time_remaining' => 'No deadline'
            ];
        }

        $now = now();
        $daysUntilDue = $now->diffInDays($dueDate, false);
        $isOverdue = $daysUntilDue < 0;

        $priorityConfig = [
            'expired' => [
                'label' => 'EXPIRED',
                'color' => 'red',
                'icon' => 'x-circle',
                'urgency' => 'critical'
            ],
            'critical' => [
                'label' => 'CRITICAL',
                'color' => 'red',
                'icon' => 'alert-triangle',
                'urgency' => 'critical'
            ],
            'overdue' => [
                'label' => 'OVERDUE',
                'color' => 'red',
                'icon' => 'alert-circle',
                'urgency' => 'critical'
            ],
            'high' => [
                'label' => 'HIGH PRIORITY',
                'color' => 'orange',
                'icon' => 'clock',
                'urgency' => 'high'
            ],
            'medium' => [
                'label' => 'MEDIUM PRIORITY',
                'color' => 'yellow',
                'icon' => 'clock',
                'urgency' => 'medium'
            ],
            'low' => [
                'label' => 'LOW PRIORITY',
                'color' => 'green',
                'icon' => 'clock',
                'urgency' => 'low'
            ],
            'no_urgency' => [
                'label' => 'NO URGENCY',
                'color' => 'gray',
                'icon' => 'circle',
                'urgency' => 'none'
            ]
        ];

        $config = $priorityConfig[$priority];
        
        return [
            'level' => $priority,
            'label' => $config['label'],
            'color' => $config['color'],
            'icon' => $config['icon'],
            'urgency' => $config['urgency'],
            'days_until_due' => $daysUntilDue,
            'is_overdue' => $isOverdue,
            'due_date' => $dueDate,
            'formatted_due_date' => $dueDate->format('M j, Y'),
            'time_remaining' => $this->getTimeRemainingText($daysUntilDue, $isOverdue)
        ];
    }

    /**
     * Get human-readable time remaining text
     */
    private function getTimeRemainingText(int $daysUntilDue, bool $isOverdue): string
    {
        if ($isOverdue) {
            $overdueDays = abs($daysUntilDue);
            if ($overdueDays === 1) {
                return '1 day overdue';
            }
            return $overdueDays . ' days overdue';
        }

        if ($daysUntilDue === 0) {
            return 'Due today';
        } elseif ($daysUntilDue === 1) {
            return 'Due tomorrow';
        } elseif ($daysUntilDue <= 7) {
            return 'Due in ' . $daysUntilDue . ' days';
        } else {
            return 'Due in ' . $daysUntilDue . ' days';
        }
    }

    /**
     * Check if inspection is urgent (high or overdue priority)
     */
    public function isUrgent(): bool
    {
        $priority = $this->getPriorityLevel();
        return in_array($priority, ['high', 'overdue']);
    }

    /**
     * Check if inspection is overdue
     */
    public function isOverdue(): bool
    {
        return $this->getPriorityLevel() === 'overdue';
    }

    /**
     * Check if inspection has expired
     */
    public function hasExpired(): bool
    {
        if ($this->is_expired) {
            return true;
        }
        
        if ($this->expiry_date) {
            return now()->isAfter($this->expiry_date);
        }
        
        return false;
    }

    /**
     * Check if inspection is critical (expires within 1 day)
     */
    public function isCritical(): bool
    {
        if ($this->hasExpired()) {
            return false; // Already expired
        }
        
        if ($this->expiry_date) {
            $daysUntilExpiry = now()->diffInDays($this->expiry_date, false);
            return $daysUntilExpiry <= 1;
        }
        
        return false;
    }

    /**
     * Mark inspection as expired and calculate performance penalty
     */
    public function markAsExpired(): void
    {
        if ($this->hasExpired() && !$this->is_expired) {
            $this->is_expired = true;
            $this->expired_at = now();
            
            // Calculate performance penalty based on how overdue it is
            if ($this->expiry_date) {
                $overdueDays = now()->diffInDays($this->expiry_date, false);
                if ($overdueDays < 0) {
                    // Base penalty: 10 points per day overdue, max 100 points
                    $this->performance_penalty = min(abs($overdueDays) * 10, 100);
                }
            }
            
            $this->save();
        }
    }

    /**
     * Get performance impact for operator
     */
    public function getPerformanceImpact(): array
    {
        if (!$this->hasExpired()) {
            return [
                'penalty' => 0,
                'status' => 'no_impact',
                'message' => 'Inspection not expired'
            ];
        }

        $penalty = $this->performance_penalty;
        $status = 'penalty_applied';
        $message = "Inspection expired. Performance penalty: {$penalty} points";

        return [
            'penalty' => $penalty,
            'status' => $status,
            'message' => $message
        ];
    }

    /**
     * Get the validation rules for creating a new inspection.
     *
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,completed,archived,failed',
            'expiry_date' => 'nullable|date|after:now',
            'operator_id' => 'nullable|exists:users,id',
        ];
    }

    /**
     * Get the validation rules for updating an existing inspection.
     *
     * @param int $id The ID of the inspection being updated
     * @return array<string, mixed>
     */
    public static function updateValidationRules(int $id): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,completed,archived,failed',
            'expiry_date' => 'nullable|date',
            'operator_id' => 'nullable|exists:users,id',
        ];
    }

    /**
     * Get the parent template for this inspection instance.
     */
    public function parentTemplate(): BelongsTo
    {
        return $this->belongsTo(Inspection::class, 'parent_inspection_id');
    }

    /**
     * Get the instances generated from this inspection template.
     */
    public function instances(): HasMany
    {
        return $this->hasMany(Inspection::class, 'parent_inspection_id');
    }
    
    /**
     * Update inspection status based on task and sub-task results
     */
    public function updateStatusBasedOnResults(): void
    {
        // Get all tasks for this inspection with their results
        $tasks = $this->tasks()->with(['results', 'subTasks'])->get();
        
        if ($tasks->isEmpty()) {
            return; // No tasks to evaluate
        }
        
        $hasFailedTasks = false;
        $allTasksCompleted = true;
        
        foreach ($tasks as $task) {
            // Check if task has results
            if ($task->results->isEmpty()) {
                $allTasksCompleted = false;
                continue;
            }
            
            // Get the latest result for this task
            $latestResult = $task->results->sortByDesc('created_at')->first();
            
            // If the latest result failed, mark inspection as failed
            if (!$latestResult->is_passing) {
                $hasFailedTasks = true;
                break;
            }
            
            // Check sub-tasks if they exist
            if ($task->subTasks->isNotEmpty()) {
                $subTasks = $task->subTasks;
                $totalSubTasks = $subTasks->count();
                $completedSubTasks = $subTasks->where('status', 'completed')->count();
                $failedSubTasks = $subTasks->filter(function($subTask) {
                    // Check if sub-task has recorded values but is not passing
                    if ($subTask->type === 'yes_no' && $subTask->recorded_value_boolean !== null) {
                        return !$subTask->isPassing($subTask->recorded_value_boolean, null);
                    } elseif ($subTask->type === 'numeric' && $subTask->recorded_value_numeric !== null) {
                        return !$subTask->isPassing(null, $subTask->recorded_value_numeric);
                    }
                    return false;
                })->count();
                
                // If any sub-task has failed, mark inspection as failed
                if ($failedSubTasks > 0) {
                    $hasFailedTasks = true;
                    break;
                }
                
                // If not all sub-tasks are completed, inspection is not complete
                if ($completedSubTasks !== $totalSubTasks) {
                    $allTasksCompleted = false;
                }
            }
        }
        
        // Update inspection status based on results
        if ($hasFailedTasks) {
            if ($this->status !== 'failed') {
                $this->update(['status' => 'failed']);
                \Log::info('Updated inspection status to failed due to failed tasks/sub-tasks', [
                    'inspection_id' => $this->id
                ]);
                
                // Note: Maintenance records are created by individual task failures in the controllers
                // This prevents duplicate maintenance records
            }
        } elseif ($allTasksCompleted) {
            if ($this->status !== 'completed') {
                // Set the completed_by field to the current user (operator who completed it)
                $this->update([
                    'status' => 'completed',
                    'completed_by' => auth()->id()
                ]);
                \Log::info('Updated inspection status to completed', [
                    'inspection_id' => $this->id,
                    'completed_by' => auth()->id()
                ]);
                
                // Update related maintenance records to completed
                $this->updateRelatedMaintenanceStatus();
            }
        }
    }
    
    /**
     * Update related maintenance records when inspection is completed
     */
    private function updateRelatedMaintenanceStatus(): void
    {
        // Find all maintenance records related to this inspection
        $relatedMaintenances = \App\Models\Maintenance::where('inspection_id', $this->id)
            ->where('created_from_inspection', true)
            ->where('status', '!=', 'completed')
            ->get();
            
        foreach ($relatedMaintenances as $maintenance) {
            $maintenance->update(['status' => 'completed']);
            \Log::info('Updated maintenance status to completed due to inspection completion', [
                'inspection_id' => $this->id,
                'maintenance_id' => $maintenance->id
            ]);
        }
    }

    /**
     * Create a maintenance record when an inspection fails
     */
    private function createMaintenanceFromFailedInspection(): void
    {
        try {
            // Find the failed task(s)
            $failedTasks = $this->tasks()->with(['results' => function($query) {
                $query->latest();
            }])->get()->filter(function($task) {
                return $task->results->isNotEmpty() && !$task->results->first()->is_passing;
            });

            if ($failedTasks->isEmpty()) {
                \Log::warning("No failed tasks found for inspection - checking for failed subtasks", [
                    'inspection_id' => $this->id
                ]);
                
                // Check for failed subtasks
                $tasksWithFailedSubtasks = $this->tasks()->with(['subTasks'])->get()->filter(function($task) {
                    return $task->subTasks->contains(function($subTask) {
                        return $subTask->type === 'yes_no' && $subTask->recorded_value_boolean !== null && !$subTask->isPassing($subTask->recorded_value_boolean, null)
                            || $subTask->type === 'numeric' && $subTask->recorded_value_numeric !== null && !$subTask->isPassing(null, $subTask->recorded_value_numeric);
                    });
                });

                if ($tasksWithFailedSubtasks->isEmpty()) {
                    \Log::warning("No failed tasks or subtasks found - creating generic maintenance", [
                        'inspection_id' => $this->id
                    ]);
                    
                    // Create a generic maintenance record
                    $maintenance = \App\Models\Maintenance::create([
                        'title' => "Maintenance Required - {$this->name}",
                        'description' => "Automatic maintenance created due to failed inspection: {$this->name}.",
                        'maintenance_date' => now(),
                        'status' => 'pending',
                        'user_id' => auth()->id(),
                        'created_from_inspection' => true,
                        'inspection_id' => $this->id,
                    ]);
                    
                    \Log::info("Created generic maintenance from failed inspection", [
                        'inspection_id' => $this->id,
                        'maintenance_id' => $maintenance->id
                    ]);
                    return;
                }
                
                $failedTasks = $tasksWithFailedSubtasks;
            }

            // Process each failed task
            foreach ($failedTasks as $task) {
                // Get drive information based on target type
                $drive = null;
                $targetDescription = '';
                $failureDetails = '';

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

                // Get failure details
                if ($task->results->isNotEmpty()) {
                    $latestResult = $task->results->first();
                    $failureDetails = "Failed Task: {$task->name}. Result: " . 
                        ($latestResult->value_boolean !== null ? 
                            ($latestResult->value_boolean ? 'Yes' : 'No') : 
                            $latestResult->value_numeric) .
                        ($latestResult->notes ? " Notes: {$latestResult->notes}" : '');
                } else {
                    // Check for failed subtasks
                    $failedSubtasks = $task->subTasks->filter(function($subTask) {
                        return $subTask->type === 'yes_no' && $subTask->recorded_value_boolean !== null && !$subTask->isPassing($subTask->recorded_value_boolean, null)
                            || $subTask->type === 'numeric' && $subTask->recorded_value_numeric !== null && !$subTask->isPassing(null, $subTask->recorded_value_numeric);
                    });
                    
                    if ($failedSubtasks->isNotEmpty()) {
                        $failureDetails = "Failed Task: {$task->name} with failed subtasks: " . 
                            $failedSubtasks->pluck('name')->join(', ');
                    }
                }

                // Create maintenance record for this failed task
                $maintenance = \App\Models\Maintenance::create([
                    'drive_id' => $drive ? $drive->id : null,
                    'title' => "Maintenance Required: {$task->name}",
                    'description' => "Automatic maintenance created due to failed inspection task. " .
                                   ($targetDescription ? $targetDescription . ". " : "") .
                                   $failureDetails,
                    'maintenance_date' => now(),
                    'status' => 'pending',
                    'user_id' => auth()->id(),
                    'created_from_inspection' => true,
                    'inspection_id' => $this->id,
                    'inspection_task_id' => $task->id,
                    'checklist_json' => [
                        [
                            'id' => 1,
                            'task' => "Fix issue: {$task->name}",
                            'completed' => false,
                            'notes' => ''
                        ],
                        [
                            'id' => 2,
                            'task' => 'Verify fix resolves the issue',
                            'completed' => false,
                            'notes' => ''
                        ],
                        [
                            'id' => 3,
                            'task' => 'Schedule follow-up inspection',
                            'completed' => false,
                            'notes' => ''
                        ]
                    ]
                ]);

                \Log::info("Created maintenance from failed task", [
                    'inspection_id' => $this->id,
                    'maintenance_id' => $maintenance->id,
                    'task_id' => $task->id,
                    'target_type' => $task->target_type,
                    'target_id' => $task->target_id,
                    'drive_id' => $drive ? $drive->id : null,
                    'drive_name' => $drive ? $drive->name : 'N/A'
                ]);
            }
            
        } catch (\Exception $e) {
            \Log::error('Failed to create maintenance from inspection failure', [
                'error' => $e->getMessage(),
                'inspection_id' => $this->id
            ]);
        }
    }
}
