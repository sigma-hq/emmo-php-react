<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'frequency',
        'start_date',
        'end_date',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Get the user who created the template.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the inspections for this template.
     */
    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'template_id');
    }

    /**
     * Get the tasks for this template.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(InspectionTask::class, 'template_id')->orderBy('order');
    }
}
