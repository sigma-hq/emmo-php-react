<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionTaskResult extends Model
{
    protected $fillable = [
        'inspection_id',
        'task_id',
        'value',
        'notes',
        'passed',
        'failure_reason',
        'recorded_by',
    ];

    protected $casts = [
        'passed' => 'boolean',
    ];

    /**
     * Get the inspection this result belongs to.
     */
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    /**
     * Get the task this result is for.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(InspectionTask::class, 'task_id');
    }

    /**
     * Get the user who recorded this result.
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Validate this result against its task's validation criteria.
     */
    public function validate(): bool
    {
        $task = $this->task;
        if (!$task) {
            return false;
        }

        return $task->validateValue($this->value);
    }
} 