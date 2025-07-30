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
        // Scheduling related fields
        'is_template',
        'parent_inspection_id',
        'unique_constraint',
        'schedule_frequency',
        'schedule_interval',
        'schedule_start_date',
        'schedule_end_date',
        'schedule_next_due_date',
        'schedule_last_created_at'
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
     * Get the validation rules for creating a new inspection.
     *
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,completed,archived',
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
            'status' => 'required|in:draft,active,completed,archived',
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
            }
        } elseif ($allTasksCompleted) {
            if ($this->status !== 'completed') {
                $this->update(['status' => 'completed']);
                \Log::info('Updated inspection status to completed', [
                    'inspection_id' => $this->id
                ]);
            }
        }
    }
}
