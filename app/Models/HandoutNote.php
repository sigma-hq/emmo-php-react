<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
