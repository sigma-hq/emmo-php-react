<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionSubTask extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inspection_task_id',
        'name',
        'description',
        'type',
        'status',
        'expected_value_boolean',
        'expected_value_min',
        'expected_value_max',
        'unit_of_measure',
        'recorded_value_boolean',
        'recorded_value_numeric',
        'completed_by',
        'completed_at',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'completed_at' => 'datetime',
        'expected_value_boolean' => 'boolean',
        'expected_value_min' => 'float',
        'expected_value_max' => 'float',
        'recorded_value_boolean' => 'boolean',
        'recorded_value_numeric' => 'float',
    ];

    /**
     * The attributes that should be appended to model arrays.
     *
     * @var array
     */
    protected $appends = ['compliance'];

    /**
     * Get the parent task that owns this sub-task.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(InspectionTask::class, 'inspection_task_id');
    }

    /**
     * Get the user who completed this sub-task.
     */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Get the validation rules for creating a new sub-task.
     *
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'inspection_task_id' => 'required|exists:inspection_tasks,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:yes_no,numeric,none',
            'expected_value_boolean' => 'nullable|boolean|required_if:type,yes_no',
            'expected_value_min' => 'nullable|numeric|required_if:type,numeric',
            'expected_value_max' => 'nullable|numeric|required_if:type,numeric',
            'unit_of_measure' => 'nullable|string|max:50|required_if:type,numeric',
            'status' => 'nullable|in:pending,completed',
            'sort_order' => 'nullable|integer',
        ];
    }

    /**
     * Mark this sub-task as completed.
     *
     * @param int|null $userId The ID of the user completing the task
     * @return bool
     */
    public function complete(?int $userId = null): bool
    {
        $this->status = 'completed';
        $this->completed_by = $userId;
        $this->completed_at = now();
        
        $saved = $this->save();
        
        // Update the inspection status after saving the sub-task
        if ($saved) {
            $this->task->inspection->updateStatusBasedOnResults();
        }
        
        return $saved;
    }

    /**
     * Mark this sub-task as pending.
     *
     * @return bool
     */
    public function resetToPending(): bool
    {
        $this->status = 'pending';
        $this->completed_by = null;
        $this->completed_at = null;
        $this->recorded_value_boolean = null;
        $this->recorded_value_numeric = null;
        
        $saved = $this->save();
        
        // Update the inspection status after saving the sub-task
        if ($saved) {
            $this->task->inspection->updateStatusBasedOnResults();
        }
        
        return $saved;
    }

    /**
     * Determine if a result passes this sub-task's requirements.
     *
     * @param bool|null $booleanValue
     * @param float|null $numericValue
     * @return bool
     */
    public function isPassing(?bool $booleanValue, ?float $numericValue): bool
    {
        if ($this->type === 'none') {
            // For type 'none', we don't evaluate values, only completion status
            return $this->status === 'completed';
        }
        else if ($this->type === 'yes_no' && $booleanValue !== null) {
            return $booleanValue === $this->expected_value_boolean;
        } 
        else if ($this->type === 'numeric' && $numericValue !== null) {
            return $numericValue >= $this->expected_value_min && $numericValue <= $this->expected_value_max;
        }
        
        return false;
    }

    /**
     * Get the compliance status of the sub-task based on its recorded value.
     *
     * @return string
     */
    public function getComplianceAttribute(): string
    {
        // If the subtask itself is pending, or no result has been recorded for relevant types
        if ($this->status === 'pending') {
            return 'pending_action'; // Indicates the subtask action (like checking the box) hasn't been done
        }

        if ($this->type === 'none') {
            // For 'none' type, if it's completed, it's just 'complete'. No pass/fail/warn criteria based on value.
            return 'complete'; 
        }

        if ($this->type === 'yes_no') {
            if ($this->recorded_value_boolean === null) {
                return 'pending_result'; // Action done, but specific result not recorded (should not happen with current logic)
            }
            if ($this->expected_value_boolean === null) {
                return 'misconfigured'; // Expected value not set
            }
            return $this->recorded_value_boolean === $this->expected_value_boolean ? 'passing' : 'failing';
        }

        if ($this->type === 'numeric') {
            if ($this->recorded_value_numeric === null) {
                return 'pending_result'; // Action done, but specific result not recorded
            }
            if ($this->expected_value_min === null || $this->expected_value_max === null) {
                return 'misconfigured'; // Expected range not set
            }

            if ($this->recorded_value_numeric >= $this->expected_value_min && $this->recorded_value_numeric <= $this->expected_value_max) {
                return 'passing';
            } elseif ($this->recorded_value_numeric > $this->expected_value_max) {
                return 'warning'; // Higher than expected is a warning
            } else { // Less than min, or other conditions not met
                return 'failing';
            }
        }

        return 'unknown'; // Should not be reached if type is one of the enum values
    }
}
