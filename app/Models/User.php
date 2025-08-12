<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
     * Get the inspections created by the user.
     */
    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'created_by');
    }
    
    /**
     * Get the inspections assigned to this user as operator.
     */
    public function assignedInspections()
    {
        return $this->hasMany(Inspection::class, 'operator_id');
    }

    /**
     * Get the inspections completed by this user.
     */
    public function completedInspections()
    {
        return $this->hasMany(Inspection::class, 'completed_by');
    }
    
    /**
     * Get the maintenances created by the user.
     */
    public function maintenances()
    {
        return $this->hasMany(Maintenance::class, 'user_id');
    }
    
    /**
     * Get the performance records for this user.
     */
    public function performanceRecords()
    {
        return $this->hasMany(OperatorPerformance::class);
    }
    
    /**
     * Get the latest performance record for this user.
     */
    public function latestPerformance()
    {
        return $this->hasOne(OperatorPerformance::class)->latestOfMany('period_end');
    }
    

}
