<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inspection;
use App\Models\Maintenance;

class CreateMaintenanceForFailedInspections extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspections:create-maintenance-for-failed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create maintenance records for existing failed inspections';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Looking for failed inspections...');

        // Get all failed inspections
        $failedInspections = Inspection::where('status', 'failed')->get();

        if ($failedInspections->isEmpty()) {
            $this->info('No failed inspections found.');
            return;
        }

        $this->info("Found {$failedInspections->count()} failed inspections.");

        $bar = $this->output->createProgressBar($failedInspections->count());
        $bar->start();

        foreach ($failedInspections as $inspection) {
            // Get the target (drive or part) from the first task
            $firstTask = $inspection->tasks()->first();
            
            if (!$firstTask) {
                // Create a generic maintenance record without specific drive association
                $maintenance = Maintenance::create([
                    'drive_id' => 1, // Default to first drive
                    'title' => "Maintenance Required - {$inspection->name}",
                    'description' => "Automatic maintenance created due to failed inspection: {$inspection->name}. This inspection had no specific drive/part tasks assigned.",
                    'maintenance_date' => now(),
                    'status' => 'pending',
                    'user_id' => 1, // Default user
                    'created_from_inspection' => true,
                    'inspection_id' => $inspection->id,
                    'checklist_json' => [
                        [
                            'id' => 1,
                            'task' => "Review and fix issues identified in inspection: {$inspection->name}",
                            'completed' => false,
                            'notes' => ''
                        ],
                        [
                            'id' => 2,
                            'task' => 'Verify all inspection criteria are met',
                            'completed' => false,
                            'notes' => ''
                        ],
                        [
                            'id' => 3,
                            'task' => 'Schedule follow-up inspection if required',
                            'completed' => false,
                            'notes' => ''
                        ],
                        [
                            'id' => 4,
                            'task' => 'Add specific tasks to this inspection for future reference',
                            'completed' => false,
                            'notes' => ''
                        ]
                    ]
                ]);
            } else {
                $targetType = $firstTask->target_type;
                $targetId = $firstTask->target_id;
                
                // Only create maintenance for drives
                if ($targetType === 'drive') {
                    $drive = \App\Models\Drive::find($targetId);
                    if ($drive) {
                        $maintenance = Maintenance::create([
                            'drive_id' => $targetId,
                            'title' => "Maintenance Required - {$inspection->name}",
                            'description' => "Automatic maintenance created due to failed inspection: {$inspection->name}. Drive: {$drive->name}",
                            'maintenance_date' => now(),
                            'status' => 'pending',
                            'user_id' => 1, // Default user
                            'created_from_inspection' => true,
                            'inspection_id' => $inspection->id,
                            'checklist_json' => [
                                [
                                    'id' => 1,
                                    'task' => "Review and fix issues identified in inspection: {$inspection->name}",
                                    'completed' => false,
                                    'notes' => ''
                                ],
                                [
                                    'id' => 2,
                                    'task' => 'Verify all inspection criteria are met',
                                    'completed' => false,
                                    'notes' => ''
                                ],
                                [
                                    'id' => 3,
                                    'task' => 'Schedule follow-up inspection if required',
                                    'completed' => false,
                                    'notes' => ''
                                ]
                            ]
                        ]);
                    }
                }
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Maintenance records created successfully!');
    }
}
