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
    ];

    /**
     * Get the parts attached to this drive.
     */
    public function parts(): HasMany
    {
        return $this->hasMany(Part::class);
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
        ];
    }
}
