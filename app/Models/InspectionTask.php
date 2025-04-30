<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionTask extends Model
{
    protected $fillable = [
        'template_id',
        'name',
        'description',
        'validation_type',
        'expected_value',
        'min_value',
        'max_value',
        'drive_id',
        'part_id',
        'order',
        'required',
    ];

    protected $casts = [
        'required' => 'boolean',
    ];

    /**
     * Get the template this task belongs to.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(InspectionTemplate::class);
    }

    /**
     * Get the drive this task is related to.
     */
    public function drive(): BelongsTo
    {
        return $this->belongsTo(Drive::class);
    }

    /**
     * Get the part this task is related to.
     */
    public function part(): BelongsTo
    {
        return $this->belongsTo(Part::class);
    }

    /**
     * Get the results for this task.
     */
    public function results(): HasMany
    {
        return $this->hasMany(InspectionTaskResult::class, 'task_id');
    }

    /**
     * Validate a given result value against this task's validation criteria.
     */
    public function validateValue($value): bool
    {
        switch ($this->validation_type) {
            case 'yes_no':
                return $value === $this->expected_value;
            case 'numeric_range':
                return is_numeric($value) && 
                    (empty($this->min_value) || $value >= $this->min_value) && 
                    (empty($this->max_value) || $value <= $this->max_value);
            case 'visual_check':
                return $value === 'pass';
            case 'text_input':
                return !empty($value);
            default:
                return true;
        }
    }
} 