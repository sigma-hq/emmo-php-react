<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HandoutComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'content',
        'handout_note_id',
        'user_id',
    ];

    public function handoutNote(): BelongsTo
    {
        return $this->belongsTo(HandoutNote::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}


