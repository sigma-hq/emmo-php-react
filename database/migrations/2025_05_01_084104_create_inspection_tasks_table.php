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
        Schema::dropIfExists('inspection_tasks');
        
        Schema::create('inspection_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['yes_no', 'numeric'])->default('yes_no');
            $table->enum('target_type', ['drive', 'part'])->nullable();
            $table->unsignedBigInteger('target_id')->nullable(); // Either drive_id or part_id
            
            // For yes/no type
            $table->boolean('expected_value_boolean')->nullable();
            
            // For numeric type
            $table->decimal('expected_value_min', 10, 2)->nullable();
            $table->decimal('expected_value_max', 10, 2)->nullable();
            $table->string('unit_of_measure')->nullable(); // e.g., mm, kg, etc.
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_tasks');
    }
};
