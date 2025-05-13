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
            // Add a unique constraint column to help prevent duplicate scheduled inspections
            $table->string('unique_constraint')->nullable()->after('parent_inspection_id');
            $table->index('unique_constraint'); // Add index for performance
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropIndex(['unique_constraint']);
            $table->dropColumn('unique_constraint');
        });
    }
};
