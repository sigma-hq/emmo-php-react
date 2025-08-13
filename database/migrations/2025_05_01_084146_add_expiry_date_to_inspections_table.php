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
            // Add expiry date for individual inspections (separate from scheduling)
            $table->dateTime('expiry_date')->nullable()->after('schedule_last_created_at')->index();
            
            // Add performance tracking fields
            $table->boolean('is_expired')->default(false)->after('expiry_date')->index();
            $table->dateTime('expired_at')->nullable()->after('is_expired');
            $table->integer('performance_penalty')->default(0)->after('expired_at'); // Points deducted for performance
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropIndex(['expiry_date']);
            $table->dropIndex(['is_expired']);
            $table->dropColumn([
                'expiry_date',
                'is_expired', 
                'expired_at',
                'performance_penalty'
            ]);
        });
    }
};

