<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionResult extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inspection_id',
        'task_id',
        'performed_by',
        'value_boolean',
        'value_numeric',
        'is_passing',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'value_boolean' => 'boolean',
        'value_numeric' => 'float',
        'is_passing' => 'boolean',
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
     * Get the user who performed this inspection.
     */
    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Calculate if the result passes based on the task requirements.
     */
    public function calculatePassingStatus(): bool
    {
        $task = $this->task;
        
        if (!$task) {
            return false;
        }
        
        return $task->isPassing($this->value_boolean, $this->value_numeric);
    }
}
