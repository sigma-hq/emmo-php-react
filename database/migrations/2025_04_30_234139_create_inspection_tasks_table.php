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
        Schema::create('inspection_tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id');
            $table->foreign('template_id')->references('id')->on('inspection_templates');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('validation_type', ['yes_no', 'numeric_range', 'visual_check', 'text_input'])->default('yes_no');
            $table->string('expected_value')->nullable();
            $table->string('min_value')->nullable();
            $table->string('max_value')->nullable();
            $table->unsignedBigInteger('drive_id')->nullable();
            $table->foreign('drive_id')->references('id')->on('drives');
            $table->unsignedBigInteger('part_id')->nullable();
            $table->foreign('part_id')->references('id')->on('parts');
            $table->integer('order')->default(0);
            $table->boolean('required')->default(true);
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
