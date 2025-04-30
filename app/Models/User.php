<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    
    /**
     * Check if the user is an admin.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
    
    /**
     * Check if the user is an operator.
     *
     * @return bool
     */
    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }
    
    /**
     * Get inspections assigned to this user.
     */
    public function assignedInspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'assigned_to');
    }
    
    /**
     * Get inspections completed by this user.
     */
    public function completedInspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'completed_by');
    }
    
    /**
     * Get inspection templates created by this user.
     */
    public function createdTemplates(): HasMany
    {
        return $this->hasMany(InspectionTemplate::class, 'created_by');
    }
    
    /**
     * Get inspection task results recorded by this user.
     */
    public function taskResults(): HasMany
    {
        return $this->hasMany(InspectionTaskResult::class, 'recorded_by');
    }
}
