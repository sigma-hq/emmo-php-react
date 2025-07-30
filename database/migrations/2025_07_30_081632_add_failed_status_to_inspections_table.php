<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For now, we'll just add the validation rule change
        // The actual database enum change will be handled by the application layer
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed for validation rule changes
    }
};
