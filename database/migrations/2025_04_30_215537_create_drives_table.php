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
        Schema::create('drives', function (Blueprint $table) {
            $table->id();
            $table->string('name');  // Required
            $table->string('drive_ref')->unique();  // Required, unique reference
            $table->string('location')->nullable();  // Optional location
            $table->text('notes')->nullable();  // Optional notes
            $table->timestamps();  // Created_at, updated_at
            $table->softDeletes();  // For soft deletes (deleted_at)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drives');
    }
};
