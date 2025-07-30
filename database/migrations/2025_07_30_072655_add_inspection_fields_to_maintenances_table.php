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
        Schema::table('maintenances', function (Blueprint $table) {
            $table->boolean('created_from_inspection')->default(false)->after('user_id');
            $table->foreignId('inspection_id')->nullable()->after('created_from_inspection')->constrained()->onDelete('set null');
            $table->foreignId('inspection_task_id')->nullable()->after('inspection_id')->constrained()->onDelete('set null');
            $table->foreignId('inspection_result_id')->nullable()->after('inspection_task_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            $table->dropForeign(['inspection_id']);
            $table->dropForeign(['inspection_task_id']);
            $table->dropForeign(['inspection_result_id']);
            $table->dropColumn(['created_from_inspection', 'inspection_id', 'inspection_task_id', 'inspection_result_id']);
        });
    }
};
