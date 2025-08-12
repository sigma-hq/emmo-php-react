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
        Schema::create('operator_performances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->datetime('period_start');
            $table->datetime('period_end');
            $table->integer('total_inspections_assigned')->default(0);
            $table->integer('completed_inspections')->default(0);
            $table->integer('failed_inspections')->default(0);
            $table->integer('pending_inspections')->default(0);
            $table->decimal('completion_rate', 5, 2)->default(0);
            $table->decimal('pass_rate', 5, 2)->default(0);
            $table->datetime('last_activity_at')->nullable();
            $table->integer('days_since_last_activity')->default(0);
            $table->decimal('performance_score', 5, 2)->default(0);
            $table->enum('status', ['active', 'warning', 'critical', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'period_start', 'period_end']);
            $table->index(['status', 'performance_score']);
            $table->index(['last_activity_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operator_performances');
    }
};
