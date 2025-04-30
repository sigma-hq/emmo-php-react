<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inspection extends Model
{
    protected $fillable = [
        'template_id',
        'status',
        'scheduled_date',
        'completed_date',
        'assigned_to',
        'completed_by',
        'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
    ];

    /**
     * Get the template for this inspection.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(InspectionTemplate::class);
    }

    /**
     * Get the user assigned to this inspection.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who completed this inspection.
     */
    public function completedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Get the results for this inspection.
     */
    public function taskResults(): HasMany
    {
        return $this->hasMany(InspectionTaskResult::class);
    }

    /**
     * Determine if the inspection is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Determine if the inspection has failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === 'failed';
    }
}
