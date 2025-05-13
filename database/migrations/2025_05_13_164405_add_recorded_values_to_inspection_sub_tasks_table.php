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
        Schema::table('inspection_sub_tasks', function (Blueprint $table) {
            $table->boolean('recorded_value_boolean')->nullable()->after('unit_of_measure');
            $table->decimal('recorded_value_numeric', 8, 2)->nullable()->after('recorded_value_boolean');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_sub_tasks', function (Blueprint $table) {
            $table->dropColumn(['recorded_value_boolean', 'recorded_value_numeric']);
        });
    }
};
