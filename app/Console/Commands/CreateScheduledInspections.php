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
        $fourDaysFromNow = $now->copy()->addDays(4);

        // Find templates that are due for instance creation 4 days before due date
        $dueTemplates = Inspection::where('is_template', true)
            ->whereNotNull('schedule_next_due_date')
            ->where('schedule_next_due_date', '>', $now) // Due date is in the future
            ->where('schedule_next_due_date', '<=', $fourDaysFromNow) // But within 4 days
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

            // --- Enhanced Duplicate Prevention --- 
            // 1. Check by parent_id and due date in name (most reliable method)
            $alreadyCreatedByName = Inspection::where('parent_inspection_id', $template->id)
                                        ->where('name', $template->schedule_next_due_date->format('Y-m-d'))
                                        ->exists();
            
            // 2. Check if created within a larger time window around the due date (more generous window)
            $alreadyCreatedByTimeWindow = Inspection::where('parent_inspection_id', $template->id)
                                        ->where('created_at', '>=', $template->schedule_next_due_date->copy()->subDay()) 
                                        ->where('created_at', '<=', $template->schedule_next_due_date->copy()->addDay())
                                        ->exists();
            
            // 3. Fallback: Check using the last_created_at timestamp on the template
            $alreadyCreatedByLastTimestamp = $template->schedule_last_created_at && 
                                            $template->schedule_last_created_at->gte($template->schedule_next_due_date);
            
            if ($alreadyCreatedByName || $alreadyCreatedByTimeWindow || $alreadyCreatedByLastTimestamp) {
                 $reason = $alreadyCreatedByName ? "name match" : 
                          ($alreadyCreatedByTimeWindow ? "time window match" : "last created timestamp");
                 
                 $this->warn("Skipping template ID: {$template->id}. Duplicate detection: {$reason} for due date ({$template->schedule_next_due_date->toDateTimeString()}).");
                 Log::warning("Skipping template ID: {$template->id}. Duplicate detected via {$reason}.");
                 continue; 
            }

            // --- Original check left for backward compatibility ---
            // Check if an instance was already created very recently for this exact due date
            $alreadyCreated = Inspection::where('parent_inspection_id', $template->id)
                                        ->where('created_at', '>=', $template->schedule_next_due_date->subMinutes(5))
                                        ->exists();
            
            if ($alreadyCreated) {
                 $this->warn("Skipping template ID: {$template->id}. Instance appears to have been recently created for this due date ({$template->schedule_next_due_date->toDateTimeString()}).");
                 Log::warning("Skipping template ID: {$template->id}. Instance appears recently created.");
                 continue; 
            }

            // --- Additional unique constraint for extra safety ---
            // Add a unique key check based on template_id + due_date
            $uniqueConstraint = md5($template->id . '_' . $template->schedule_next_due_date->format('Y-m-d'));
            
            // Check if another inspection with this constraint already exists
            $constraintExists = Inspection::where('unique_constraint', $uniqueConstraint)->exists();
            
            if ($constraintExists) {
                $this->warn("Skipping template ID: {$template->id}. Duplicate detected via unique constraint.");
                Log::warning("Skipping template ID: {$template->id}. Duplicate detected via unique constraint.");
                continue;
            }
            
            // We'll set this constraint when we create the inspection

            DB::beginTransaction();
            try {
                // 1. Create new Inspection Instance
                $instance = Inspection::create([
                    // Set the name to the due date (YYYY-MM-DD)
                    'name' => $template->schedule_next_due_date->format('Y-m-d'),
                    'description' => $template->description,
                    'status' => 'active', // Or 'draft', depending on workflow
                    'created_by' => $template->created_by, // Inherit creator?
                    'is_template' => false,
                    'parent_inspection_id' => $template->id,
                    'unique_constraint' => $uniqueConstraint, // Set the unique constraint to prevent duplicates
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
