<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Part extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'part_ref',
        'status',
        'drive_id',
        'notes',
    ];

    /**
     * Get the drive that this part is attached to.
     */
    public function drive(): BelongsTo
    {
        return $this->belongsTo(Drive::class);
    }

    /**
     * Get the attachment history for this part.
     */
    public function attachmentHistory(): HasMany
    {
        return $this->hasMany(PartAttachmentHistory::class)->orderBy('created_at', 'desc');
    }

    /**
     * Record an attachment or detachment action in the history.
     * 
     * @param string $action Either 'attached' or 'detached'
     * @param int|null $driveId The ID of the drive or null if detached
     * @param string|null $notes Optional notes about this change
     * @param int|null $userId The user ID who made the change
     * @return PartAttachmentHistory
     */
    public function recordAttachmentAction(string $action, ?int $driveId, ?string $notes = null, ?int $userId = null): PartAttachmentHistory
    {
        return $this->attachmentHistory()->create([
            'drive_id' => $driveId,
            'action' => $action,
            'notes' => $notes,
            'user_id' => $userId ?? auth()->id(),
        ]);
    }

    /**
     * Get the validation rules for creating a new part.
     *
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'part_ref' => 'required|string|max:255|unique:parts,part_ref',
            'status' => 'required|in:attached,unattached',
            'drive_id' => 'nullable|exists:drives,id',
            'notes' => 'nullable|string',
        ];
    }

    /**
     * Get the validation rules for updating an existing part.
     *
     * @param int $id The ID of the part being updated
     * @return array<string, mixed>
     */
    public static function updateValidationRules(int $id): array
    {
        return [
            'name' => 'required|string|max:255',
            'part_ref' => 'required|string|max:255|unique:parts,part_ref,' . $id,
            'status' => 'required|in:attached,unattached',
            'drive_id' => 'nullable|exists:drives,id',
            'notes' => 'nullable|string',
        ];
    }
}
