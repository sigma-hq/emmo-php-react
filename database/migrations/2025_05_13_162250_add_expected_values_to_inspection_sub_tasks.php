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
            $table->enum('type', ['yes_no', 'numeric', 'none'])->default('none')->after('description');
            
            // For yes/no type
            $table->boolean('expected_value_boolean')->nullable()->after('type');
            
            // For numeric type
            $table->decimal('expected_value_min', 10, 2)->nullable()->after('expected_value_boolean');
            $table->decimal('expected_value_max', 10, 2)->nullable()->after('expected_value_min');
            $table->string('unit_of_measure')->nullable()->after('expected_value_max'); // e.g., mm, kg, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_sub_tasks', function (Blueprint $table) {
            $table->dropColumn('type');
            $table->dropColumn('expected_value_boolean');
            $table->dropColumn('expected_value_min');
            $table->dropColumn('expected_value_max');
            $table->dropColumn('unit_of_measure');
        });
    }
};
