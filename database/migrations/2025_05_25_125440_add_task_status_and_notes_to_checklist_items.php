<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Updates the checklist_json schema to support:
     * - status: 'pending', 'completed', 'failed'
     * - notes: text field for additional information about the task
     * 
     * New checklist item format:
     * {
     *   id: string,
     *   text: string,
     *   status: 'pending'|'completed'|'failed',
     *   notes: string|null,
     *   updated_at: string|null (ISO date)
     * }
     */
    public function up(): void
    {
        // Since checklist_json is stored as JSON, we need to process existing records
        // to add the new fields to each checklist item
        $maintenances = DB::table('maintenances')->whereNotNull('checklist_json')->get();
        
        foreach ($maintenances as $maintenance) {
            try {
                $checklist = json_decode($maintenance->checklist_json, true);
                
                if (is_array($checklist)) {
                    $updated = false;
                    
                    foreach ($checklist as $key => $item) {
                        // Convert old format with 'completed' boolean to new 'status' field
                        if (isset($item['completed']) && !isset($item['status'])) {
                            $checklist[$key]['status'] = $item['completed'] ? 'completed' : 'pending';
                            unset($checklist[$key]['completed']);
                            $updated = true;
                        }
                        
                        // Add notes field if it doesn't exist
                        if (!isset($item['notes'])) {
                            $checklist[$key]['notes'] = null;
                            $updated = true;
                        }
                        
                        // Add updated_at field if it doesn't exist
                        if (!isset($item['updated_at'])) {
                            $checklist[$key]['updated_at'] = now()->toIso8601String();
                            $updated = true;
                        }
                    }
                    
                    if ($updated) {
                        // Update the record with the modified checklist
                        DB::table('maintenances')
                            ->where('id', $maintenance->id)
                            ->update(['checklist_json' => json_encode($checklist)]);
                    }
                }
            } catch (\Exception $e) {
                // Log error but continue with migration
                \Illuminate\Support\Facades\Log::error('Error updating checklist format: ' . $e->getMessage(), [
                    'maintenance_id' => $maintenance->id
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     * 
     * Note: This migration doesn't modify table structure, just the JSON data format.
     * Reverting would require transforming the data back, which might lose information.
     * Therefore, we're not implementing a full reversion.
     */
    public function down(): void
    {
        // It's not practical to revert this as it would lose data
        // We could convert status back to completed boolean, but we'd lose 'failed' state information
    }
};
