<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Maintenance extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'drive_id',
        'title',
        'description',
        'maintenance_date',
        'technician',
        'status',
        'cost',
        'parts_replaced',
        'user_id',
        'checklist_json',
        'created_from_inspection',
        'inspection_id',
        'inspection_task_id',
        'inspection_result_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'maintenance_date' => 'date',
        'cost' => 'decimal:2',
        'parts_replaced' => 'array',
        'checklist_json' => 'array',
    ];

    /**
     * Get the drive that this maintenance is for.
     */
    public function drive(): BelongsTo
    {
        return $this->belongsTo(Drive::class);
    }

    /**
     * Get the user who created this maintenance record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the inspection that triggered this maintenance (if created from inspection).
     */
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    /**
     * Get the inspection task that triggered this maintenance (if created from inspection).
     */
    public function inspectionTask(): BelongsTo
    {
        return $this->belongsTo(InspectionTask::class);
    }

    /**
     * Get the inspection result that triggered this maintenance (if created from inspection).
     */
    public function inspectionResult(): BelongsTo
    {
        return $this->belongsTo(InspectionResult::class);
    }

    /**
     * Get an array of status options for display.
     *
     * @return array<string, string>
     */
    public static function getStatusOptions(): array
    {
        return [
            'pending' => 'Pending',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
        ];
    }

    /**
     * Get the display friendly version of the status.
     */
    public function getStatusLabelAttribute(): string
    {
        return self::getStatusOptions()[$this->status] ?? $this->status;
    }
    
    /**
     * Get the task status options for checklist items.
     *
     * @return array<string, string>
     */
    public static function getTaskStatusOptions(): array
    {
        return [
            'pending' => 'Pending',
            'completed' => 'Completed',
            'failed' => 'Failed',
        ];
    }
    
    /**
     * Update a checklist item with new status and/or notes.
     *
     * @param string $itemId The ID of the checklist item to update
     * @param array $updates The updates to apply (status, notes)
     * @return bool Whether the update was successful
     */
    public function updateChecklistItem(string $itemId, array $updates): bool
    {
        // Get the checklist and ensure it's an array
        $checklistRaw = $this->checklist_json;
        
        if (is_string($checklistRaw)) {
            try {
                $checklist = json_decode($checklistRaw, true) ?? [];
            } catch (\Exception $e) {
                $checklist = [];
            }
        } else {
            $checklist = $checklistRaw ?? [];
        }
        
        if (!is_array($checklist)) {
            $checklist = [];
        }
        
        $updated = false;
        
        foreach ($checklist as $key => $item) {
            if (isset($item['id']) && $item['id'] === $itemId) {
                // Update status if provided
                if (isset($updates['status']) && in_array($updates['status'], array_keys(self::getTaskStatusOptions()))) {
                    $checklist[$key]['status'] = $updates['status'];
                    $updated = true;
                }
                
                // Update notes if provided
                if (isset($updates['notes'])) {
                    $checklist[$key]['notes'] = $updates['notes'];
                    $updated = true;
                }
                
                // Update timestamp
                $checklist[$key]['updated_at'] = now()->toIso8601String();
                break;
            }
        }
        
        if ($updated) {
            $this->checklist_json = $checklist;
            $saved = $this->save();
            
            // Update maintenance status based on checklist completion
            if ($saved) {
                $this->updateStatusBasedOnChecklist();
            }
            
            return $saved;
        }
        
        return false;
    }
    
    /**
     * Add a new checklist item.
     *
     * @param string $text The text description of the checklist item
     * @param string $status The initial status (default: pending)
     * @param string|null $notes Optional notes
     * @return bool Whether the item was successfully added
     */
    public function addChecklistItem(string $text, string $status = 'pending', ?string $notes = null): bool
    {
        // Get the checklist and ensure it's an array
        $checklistRaw = $this->checklist_json;
        
        if (is_string($checklistRaw)) {
            try {
                $checklist = json_decode($checklistRaw, true) ?? [];
            } catch (\Exception $e) {
                $checklist = [];
            }
        } else {
            $checklist = $checklistRaw ?? [];
        }
        
        if (!is_array($checklist)) {
            $checklist = [];
        }
        
        // Validate status
        if (!in_array($status, array_keys(self::getTaskStatusOptions()))) {
            $status = 'pending';
        }
        
        // Create new item
        $checklist[] = [
            'id' => (string) time() . rand(1000, 9999),
            'text' => $text,
            'status' => $status,
            'notes' => $notes,
            'updated_at' => now()->toIso8601String(),
        ];
        
        $this->checklist_json = $checklist;
        $saved = $this->save();
        
        // Update maintenance status based on checklist completion
        if ($saved) {
            $this->updateStatusBasedOnChecklist();
        }
        
        return $saved;
    }
    
    /**
     * Remove a checklist item.
     *
     * @param string $itemId The ID of the checklist item to remove
     * @return bool Whether the item was successfully removed
     */
    public function removeChecklistItem(string $itemId): bool
    {
        // Get the checklist and ensure it's an array
        $checklistRaw = $this->checklist_json;
        
        if (is_string($checklistRaw)) {
            try {
                $checklist = json_decode($checklistRaw, true) ?? [];
            } catch (\Exception $e) {
                $checklist = [];
            }
        } else {
            $checklist = $checklistRaw ?? [];
        }
        
        if (!is_array($checklist)) {
            $checklist = [];
        }
        
        $initialCount = count($checklist);
        
        $checklist = array_filter($checklist, function ($item) use ($itemId) {
            return isset($item['id']) && $item['id'] !== $itemId;
        });
        
        if (count($checklist) !== $initialCount) {
            $this->checklist_json = array_values($checklist); // Reset array keys
            $saved = $this->save();
            
            // Update maintenance status based on checklist completion
            if ($saved) {
                $this->updateStatusBasedOnChecklist();
            }
            
            return $saved;
        }
        
        return false;
    }
    
    /**
     * Get checklist completion statistics.
     *
     * @return array With keys: total, completed, failed, pending, completion_percentage
     */
    public function getChecklistStats(): array
    {
        // Get the checklist and ensure it's an array
        $checklistRaw = $this->checklist_json;
        
        if (is_string($checklistRaw)) {
            try {
                $checklist = json_decode($checklistRaw, true) ?? [];
            } catch (\Exception $e) {
                $checklist = [];
            }
        } else {
            $checklist = $checklistRaw ?? [];
        }
        
        if (!is_array($checklist)) {
            $checklist = [];
        }
        
        $total = count($checklist);
        
        if ($total === 0) {
            return [
                'total' => 0,
                'completed' => 0,
                'failed' => 0,
                'pending' => 0,
                'completion_percentage' => 0,
            ];
        }
        
        $completed = 0;
        $failed = 0;
        $pending = 0;
        
        foreach ($checklist as $item) {
            // Handle both old format (completed boolean) and new format (status)
            if (isset($item['status'])) {
                switch ($item['status']) {
                    case 'completed':
                        $completed++;
                        break;
                    case 'failed':
                        $failed++;
                        break;
                    default:
                        $pending++;
                }
            } elseif (isset($item['completed'])) {
                // Legacy format support
                if ($item['completed']) {
                    $completed++;
                } else {
                    $pending++;
                }
            } else {
                $pending++;
            }
        }
        
        return [
            'total' => $total,
            'completed' => $completed,
            'failed' => $failed,
            'pending' => $pending,
            'completion_percentage' => round(($completed / $total) * 100),
        ];
    }
    
    /**
     * Determine the appropriate maintenance status based on checklist completion.
     *
     * @return string The status that should be set based on checklist
     */
    public function getStatusBasedOnChecklist(): string
    {
        $stats = $this->getChecklistStats();
        
        // If no tasks, keep current status or default to pending
        if ($stats['total'] === 0) {
            return $this->status ?? 'pending';
        }
        
        // If all tasks are completed, mark as completed
        if ($stats['completed'] === $stats['total']) {
            return 'completed';
        }
        
        // If any tasks are completed or failed (work has started), mark as in_progress
        if ($stats['completed'] > 0 || $stats['failed'] > 0) {
            return 'in_progress';
        }
        
        // If only pending tasks, mark as pending
        return 'pending';
    }
    
    /**
     * Update the maintenance status based on checklist completion.
     *
     * @return bool Whether the status was updated
     */
    public function updateStatusBasedOnChecklist(): bool
    {
        $newStatus = $this->getStatusBasedOnChecklist();
        
        if ($this->status !== $newStatus) {
            $this->status = $newStatus;
            return $this->save();
        }
        
        return false;
    }
}
