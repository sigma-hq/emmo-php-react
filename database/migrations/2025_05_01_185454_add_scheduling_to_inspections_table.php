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
        Schema::table('inspections', function (Blueprint $table) {
            // Template identification
            $table->boolean('is_template')->default(false)->after('status');
            $table->foreignId('parent_inspection_id')->nullable()->constrained('inspections')->onDelete('cascade')->after('id');
            
            // Scheduling fields (only relevant for templates)
            $table->string('schedule_frequency')->nullable()->after('is_template'); // e.g., 'daily', 'weekly', 'monthly', 'yearly'
            $table->unsignedInteger('schedule_interval')->default(1)->nullable()->after('schedule_frequency');
            $table->dateTime('schedule_start_date')->nullable()->after('schedule_interval');
            $table->dateTime('schedule_end_date')->nullable()->after('schedule_start_date');
            $table->dateTime('schedule_next_due_date')->nullable()->index()->after('schedule_end_date'); // Index for performance
            $table->dateTime('schedule_last_created_at')->nullable()->after('schedule_next_due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropForeign(['parent_inspection_id']);
            $table->dropColumn([
                'is_template', 
                'parent_inspection_id',
                'schedule_frequency', 
                'schedule_interval',
                'schedule_start_date',
                'schedule_end_date',
                'schedule_next_due_date',
                'schedule_last_created_at'
            ]);
        });
    }
};
