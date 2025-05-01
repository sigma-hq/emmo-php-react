<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inspection;
use App\Models\InspectionTask;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CreateScheduledInspections extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspections:create-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create new inspection instances based on scheduled templates.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for due inspection templates...');
        Log::info('Running CreateScheduledInspections command.');

        $now = Carbon::now();

        // Find templates that are due
        $dueTemplates = Inspection::where('is_template', true)
            ->whereNotNull('schedule_next_due_date')
            ->where('schedule_next_due_date', '<=', $now)
            // Optionally: Add check for schedule_end_date if needed
            // ->where(function ($query) use ($now) {
            //     $query->whereNull('schedule_end_date')
            //           ->orWhere('schedule_end_date', '>', $now);
            // })
            ->get();

        if ($dueTemplates->isEmpty()) {
            $this->info('No due inspection templates found.');
            Log::info('No due inspection templates found.');
            return 0;
        }

        $createdCount = 0;
        foreach ($dueTemplates as $template) {
            $this->info("Processing template ID: {$template->id} - {$template->name}");

            // --- Robust Duplicate Check --- 
            // Check if an instance was already created very recently for this exact due date 
            // (Handles cases where the command might run slightly after the exact due time)
            $alreadyCreated = Inspection::where('parent_inspection_id', $template->id)
                                        ->where('created_at', '>=', $template->schedule_next_due_date->subMinutes(5)) // Check within a small window
                                        ->exists();

            // Alternative/Additional Check: Compare last created timestamp with next due date
            // This assumes schedule_last_created_at is reliably updated.
            // if ($template->schedule_last_created_at && $template->schedule_last_created_at->gte($template->schedule_next_due_date)) {
            //    $this->warn("Skipping template ID: {$template->id}. Instance likely already created based on last_created_at.");
            //    Log::warning("Skipping template ID: {$template->id}. Instance likely already created based on last_created_at.");
            //    continue; // Skip to next template
            // }
            
            if ($alreadyCreated) {
                 $this->warn("Skipping template ID: {$template->id}. Instance appears to have been recently created for this due date ({$template->schedule_next_due_date->toDateTimeString()}).");
                 Log::warning("Skipping template ID: {$template->id}. Instance appears recently created.");
                 // Optionally, still recalculate the next due date if needed to avoid re-processing immediately
                 // $this->updateTemplateNextDueDate($template, $now); 
                 continue; 
            }


            DB::beginTransaction();
            try {
                // 1. Create new Inspection Instance
                $instance = Inspection::create([
                    'name' => $template->name . ' - ' . $template->schedule_next_due_date->format('Y-m-d'), // Append date to name
                    'description' => $template->description,
                    'status' => 'active', // Or 'draft', depending on workflow
                    'created_by' => $template->created_by, // Inherit creator?
                    'is_template' => false,
                    'parent_inspection_id' => $template->id,
                    // Add instance_due_date if needed: 'instance_due_date' => $template->schedule_next_due_date 
                ]);
                $this->info("  Created instance ID: {$instance->id}");

                // 2. Duplicate Tasks
                foreach ($template->tasks as $taskTemplate) {
                    $instance->tasks()->create($taskTemplate->only([
                        'name', 'description', 'type', 'target_type', 'target_id',
                        'expected_value_boolean', 'expected_value_min', 'expected_value_max', 'unit_of_measure'
                    ]));
                }
                $this->info("  Duplicated {$template->tasks->count()} tasks.");

                // 3. Update Template's Next Due Date and Last Created Timestamp
                $this->updateTemplateNextDueDate($template, $now);
                $this->info("  Updated template schedule. Next due: {$template->schedule_next_due_date->toDateTimeString()}");

                DB::commit();
                $createdCount++;

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Failed to process template ID: {$template->id}. Error: {$e->getMessage()}");
                Log::error("Failed to process inspection template ID: {$template->id}", [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        $this->info("Finished processing templates. Created {$createdCount} new inspection instances.");
        Log::info("CreateScheduledInspections command finished. Created {$createdCount} instances.");
        return 0;
    }
    
    /**
     * Calculate and update the next due date for a template.
     */
    protected function updateTemplateNextDueDate(Inspection $template, Carbon $now): void
    {
         // Use the existing helper method from InspectionController (or duplicate/refactor)
         // For simplicity, duplicating the logic here, consider refactoring to a Trait or Service
         $frequency = $template->schedule_frequency;
         $interval = $template->schedule_interval;
         $startDate = $template->schedule_start_date;
         $currentNextDueDate = $template->schedule_next_due_date; // Use the date it *was* due as the base

         $newNextDueDate = null;
         if ($frequency && $interval && $startDate && $currentNextDueDate) {
             $baseDate = $currentNextDueDate; // Calculate from the date that just passed
             switch ($frequency) {
                 case 'daily': $newNextDueDate = $baseDate->addDays($interval); break;
                 case 'weekly': $newNextDueDate = $baseDate->addWeeks($interval); break;
                 case 'monthly': $newNextDueDate = $baseDate->addMonths($interval); break;
                 case 'yearly': $newNextDueDate = $baseDate->addYears($interval); break;
             }
             
             // Check against end date
             if ($template->schedule_end_date && $newNextDueDate->gt($template->schedule_end_date)) {
                 $newNextDueDate = null; // Stop scheduling
             }
         }

         $template->schedule_next_due_date = $newNextDueDate;
         $template->schedule_last_created_at = $now; // Mark as created now
         $template->save();
    }
}
