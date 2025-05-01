<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inspection extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'status',
        'created_by',
    ];

    /**
     * Get the user who created this inspection.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the tasks belonging to this inspection.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(InspectionTask::class);
    }

    /**
     * Get the results belonging to this inspection.
     */
    public function results(): HasMany
    {
        return $this->hasMany(InspectionResult::class);
    }

    /**
     * Get the validation rules for creating a new inspection.
     *
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,completed,archived',
        ];
    }

    /**
     * Get the validation rules for updating an existing inspection.
     *
     * @param int $id The ID of the inspection being updated
     * @return array<string, mixed>
     */
    public static function updateValidationRules(int $id): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,completed,archived',
        ];
    }
}
