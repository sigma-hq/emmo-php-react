<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Drive extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'drive_ref',
        'location',
        'notes',
        'status',
    ];

    /**
     * Get the parts attached to this drive.
     */
    public function parts(): HasMany
    {
        return $this->hasMany(Part::class);
    }

    /**
     * Get the maintenance records for this drive.
     */
    public function maintenances(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }

    /**
     * Get the inspection results for this drive.
     */
    public function inspectionResults(): HasMany
    {
        return $this->hasManyThrough(
            \App\Models\InspectionResult::class,
            \App\Models\InspectionTask::class,
            'target_id', // Foreign key on inspection_tasks table
            'task_id', // Foreign key on inspection_results table
            'id', // Local key on drives table
            'id' // Local key on inspection_tasks table
        )->where('inspection_tasks.target_type', 'drive');
    }

    /**
     * Get the validation rules for creating a new drive.
     *
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'drive_ref' => 'required|string|max:255|unique:drives',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance,retired',
        ];
    }

    /**
     * Get the validation rules for updating an existing drive.
     *
     * @param int $id
     * @return array<string, mixed>
     */
    public static function updateValidationRules(int $id): array
    {
        return [
            'name' => 'required|string|max:255',
            'drive_ref' => 'required|string|max:255|unique:drives,drive_ref,'.$id,
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance,retired',
        ];
    }

    /**
     * Check if the drive has any alerts (failed inspections or pending maintenances).
     */
    public function hasAlerts(): bool
    {
        // Check for failed inspection results
        $hasFailedInspections = \App\Models\InspectionResult::whereHas('task', function ($query) {
            $query->where('target_type', 'drive')->where('target_id', $this->id);
        })->where('is_passing', false)
        ->where('created_at', '>=', now()->subDays(30)) // Only consider recent failures
        ->exists();

        // Check for pending maintenances
        $hasPendingMaintenances = $this->maintenances()
            ->where('status', 'pending')
            ->exists();

        return $hasFailedInspections || $hasPendingMaintenances;
    }

    /**
     * Get the alert count for this drive.
     */
    public function getAlertCount(): int
    {
        $failedInspections = \App\Models\InspectionResult::whereHas('task', function ($query) {
            $query->where('target_type', 'drive')->where('target_id', $this->id);
        })->where('is_passing', false)
        ->where('created_at', '>=', now()->subDays(30))
        ->count();

        $pendingMaintenances = $this->maintenances()
            ->where('status', 'pending')
            ->count();

        return $failedInspections + $pendingMaintenances;
    }
}
