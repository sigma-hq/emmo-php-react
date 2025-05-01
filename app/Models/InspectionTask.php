<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InspectionTask extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inspection_id',
        'name',
        'description',
        'type',
        'target_type',
        'target_id',
        'expected_value_boolean',
        'expected_value_min',
        'expected_value_max',
        'unit_of_measure',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expected_value_boolean' => 'boolean',
        'expected_value_min' => 'float',
        'expected_value_max' => 'float',
    ];

    /**
     * Get the inspection that this task belongs to.
     */
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    /**
     * Get the target (drive or part) for this task.
     */
    public function target()
    {
        if ($this->target_type === 'drive') {
            return $this->belongsTo(Drive::class, 'target_id');
        } else if ($this->target_type === 'part') {
            return $this->belongsTo(Part::class, 'target_id');
        }
        
        return null;
    }

    /**
     * Get the results for this task.
     */
    public function results(): HasMany
    {
        return $this->hasMany(InspectionResult::class, 'task_id')->orderBy('created_at', 'desc');
    }

    /**
     * Get the validation rules for creating a new inspection task.
     *
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'inspection_id' => 'required|exists:inspections,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:yes_no,numeric',
            'target_type' => 'nullable|in:drive,part,none',
            'target_id' => 'nullable|integer',
            'expected_value_boolean' => 'nullable|required_if:type,yes_no',
            'expected_value_min' => 'nullable|numeric|required_if:type,numeric',
            'expected_value_max' => 'nullable|numeric|required_if:type,numeric',
            'unit_of_measure' => 'nullable|string|max:50|required_if:type,numeric',
        ];
    }

    /**
     * Determine if a result passes this task's requirements.
     *
     * @param bool|null $booleanValue
     * @param float|null $numericValue
     * @return bool
     */
    public function isPassing(?bool $booleanValue, ?float $numericValue): bool
    {
        if ($this->type === 'yes_no' && $booleanValue !== null) {
            return $booleanValue === $this->expected_value_boolean;
        } else if ($this->type === 'numeric' && $numericValue !== null) {
            return $numericValue >= $this->expected_value_min && $numericValue <= $this->expected_value_max;
        }
        
        return false;
    }
}
