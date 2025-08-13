<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class HandoutNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'category',
        'user_id',
    ];

    protected $casts = [
        'category' => 'string',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(HandoutComment::class)->latest();
    }

    /**
     * Get the most recent activity timestamp (either note update or latest comment)
     */
    public function getMostRecentActivityAttribute()
    {
        $latestComment = $this->comments()->latest('created_at')->first();
        
        if ($latestComment && $latestComment->created_at > $this->updated_at) {
            return $latestComment->created_at;
        }
        
        return $this->updated_at;
    }

    /**
     * Scope to order by most recent activity
     */
    public function scopeOrderByMostRecentActivity($query)
    {
        return $query->with(['comments' => function ($query) {
            $query->latest('created_at');
        }])->orderBy('updated_at', 'desc');
    }
}
