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
            $table->text('notes')->nullable()->after('recorded_value_numeric');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_sub_tasks', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
}; 