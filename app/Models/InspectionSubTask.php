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
        'status',
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
    ];

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
        
        return $this->save();
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
        
        return $this->save();
    }
}
