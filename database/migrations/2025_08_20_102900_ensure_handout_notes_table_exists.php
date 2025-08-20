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
        // Ensure parent table exists first
        if (!Schema::hasTable('handout_notes')) {
            Schema::create('handout_notes', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('content');
                $table->enum('category', ['electrical', 'mechanical', 'hydraulic', 'workshop', 'utilities']);
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();
            });
        }

        // Ensure comments table exists as well (in case a client is missing both)
        if (!Schema::hasTable('handout_comments')) {
            Schema::create('handout_comments', function (Blueprint $table) {
                $table->id();
                $table->text('content');
                $table->foreignId('handout_note_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally conservative: only drop if they exist
        if (Schema::hasTable('handout_comments')) {
            Schema::dropIfExists('handout_comments');
        }
        if (Schema::hasTable('handout_notes')) {
            Schema::dropIfExists('handout_notes');
        }
    }
};


