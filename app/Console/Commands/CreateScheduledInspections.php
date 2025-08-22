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
        $now = Carbon::now();
        $this->info("Running CreateScheduledInspections command at {$now->toDateTimeString()}");
        Log::info('Running CreateScheduledInspections command.', ['timestamp' => $now->toISOString()]);
        
        // Dynamic frequency processing - handle different frequencies appropriately
        $dueTemplates = $this->getDueTemplates($now);

        if ($dueTemplates->isEmpty()) {
            $this->info('No due inspection templates found.');
            Log::info('No due inspection templates found.');
            return 0;
        }

        $createdCount = 0;
        foreach ($dueTemplates as $template) {
            $this->info("Processing template ID: {$template->id} - {$template->name}");

            // Check if an instance was already created for this due date
            $alreadyCreated = $this->checkIfInstanceAlreadyExists($template);
            
            if ($alreadyCreated) {
                $this->warn("Skipping template ID: {$template->id}. Instance already exists for due date ({$template->schedule_next_due_date->toDateTimeString()}).");
                Log::warning("Skipping template ID: {$template->id}. Instance already exists for due date.");
                
                // Update the template's next due date even if we skip creation
                $this->updateTemplateNextDueDate($template, $now);
                continue; 
            }

            // Check if this is an overdue template that needs special handling
            if ($this->isOverdueTemplate($template, $now)) {
                $this->info("  Processing overdue template - recalculating schedule");
                $this->handleOverdueTemplate($template, $now);
            }

            DB::beginTransaction();
            try {
                // 1. Create new Inspection Instance
                $instance = Inspection::create([
                    'name' => $this->generateInstanceName($template),
                    'description' => $template->description,
                    'status' => 'active',
                    'created_by' => $template->created_by,
                    'is_template' => false,
                    'parent_inspection_id' => $template->id,
                    'operator_id' => $template->operator_id, // Inherit operator assignment
                    'expiry_date' => $this->calculateInstanceExpiryDate($template), // Add expiry date
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
                $this->info("  Updated template schedule. Next due: " . ($template->schedule_next_due_date ? $template->schedule_next_due_date->toDateTimeString() : 'None (template ended)'));

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
        
        // Log summary with frequency breakdown
        $this->logProcessingSummary($dueTemplates, $createdCount);
        
        Log::info("CreateScheduledInspections command finished. Created {$createdCount} instances.");
        return 0;
    }
    
    /**
     * Intelligently get due templates based on frequency and current time.
     */
    protected function getDueTemplates(Carbon $now): \Illuminate\Database\Eloquent\Collection
    {
        $query = Inspection::where('is_template', true)
            ->whereNotNull('schedule_next_due_date')
            ->where('schedule_next_due_date', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('schedule_end_date')
                      ->orWhere('schedule_end_date', '>', $now);
            });

        // For minute-based templates, always check (runs every minute)
        $minuteTemplates = $query->clone()
            ->where('schedule_frequency', 'minute')
            ->get();

        // For other frequencies, only check at appropriate intervals to avoid unnecessary processing
        $otherTemplates = collect();
        
        if ($this->shouldCheckOtherFrequencies($now)) {
            $otherTemplates = $query->clone()
                ->whereIn('schedule_frequency', ['daily', 'weekly', 'monthly', 'yearly'])
                ->get();
        }

        // Also check for overdue templates that might have been missed
        $overdueTemplates = collect();
        if ($this->shouldCheckOtherFrequencies($now)) {
            $overdueQuery = Inspection::where('is_template', true)
                ->whereNotNull('schedule_start_date')
                ->where('schedule_start_date', '<=', $now->subDay()) // Started more than a day ago
                ->where(function ($query) use ($now) {
                    $query->whereNull('schedule_end_date')
                          ->orWhere('schedule_end_date', '>', $now);
                })
                ->whereIn('schedule_frequency', ['daily', 'weekly', 'monthly', 'yearly'])
                ->where(function ($query) {
                    $query->whereNull('schedule_next_due_date')
                          ->orWhere('schedule_next_due_date', '<', $now->subDay()); // Due more than a day ago
                });
            
            $overdueTemplates = $overdueQuery->get();
        }

        // Combine all templates
        $allTemplates = $minuteTemplates->merge($otherTemplates)->merge($overdueTemplates);
        
        if ($allTemplates->isNotEmpty()) {
            $this->info("Found {$allTemplates->count()} due templates:");
            foreach ($allTemplates as $template) {
                $dueStatus = $template->schedule_next_due_date && $template->schedule_next_due_date->lt($now->subDay()) ? ' (OVERDUE)' : '';
                $this->line("  - {$template->name} ({$template->schedule_frequency} every {$template->schedule_interval}){$dueStatus}");
            }
        }

        return $allTemplates;
    }

    /**
     * Determine if we should check non-minute frequencies based on current time.
     */
    protected function shouldCheckOtherFrequencies(Carbon $now): bool
    {
        // Check daily templates every 5 minutes for better responsiveness
        if ($now->minute % 5 === 0) {
            return true;
        }

        // Check weekly/monthly/yearly templates every hour (at minute 0)
        if ($now->minute === 0) {
            return true;
        }

        return false;
    }

    /**
     * Calculate expiry date for the inspection instance based on template frequency.
     */
    protected function calculateInstanceExpiryDate(Inspection $template): ?Carbon
    {
        $dueDate = $template->schedule_next_due_date;
        
        if (!$dueDate) {
            return null;
        }
        
        switch ($template->schedule_frequency) {
            case 'minute':
                // Minute-based: expire in 1 hour
                return $dueDate->copy()->addHour();
                
            case 'daily':
                // Daily: expire at end of day
                return $dueDate->copy()->endOfDay();
                
            case 'weekly':
                // Weekly: expire at end of week
                return $dueDate->copy()->endOfWeek();
                
            case 'monthly':
                // Monthly: expire at end of month
                return $dueDate->copy()->endOfMonth();
                
            case 'yearly':
                // Yearly: expire at end of year
                return $dueDate->copy()->endOfYear();
                
            default:
                return $dueDate->copy()->addDay();
        }
    }

    /**
     * Check if a template is overdue and needs special handling.
     */
    protected function isOverdueTemplate(Inspection $template, Carbon $now): bool
    {
        if ($template->schedule_frequency === 'minute') {
            return false; // Minute templates are handled differently
        }
        
        return $template->schedule_next_due_date && 
               $template->schedule_next_due_date->lt($now->subDay());
    }

    /**
     * Handle overdue templates by recalculating their schedule.
     */
    protected function handleOverdueTemplate(Inspection $template, Carbon $now): void
    {
        $frequency = $template->schedule_frequency;
        $interval = $template->schedule_interval;
        $startDate = $template->schedule_start_date;
        
        if (!$frequency || !$interval || !$startDate) {
            return;
        }

        // Calculate the next due date from the start date, skipping past due dates
        $nextDueDate = Carbon::parse($startDate);
        
        while ($nextDueDate->lt($now)) {
            switch ($frequency) {
                case 'daily': $nextDueDate->addDays($interval); break;
                case 'weekly': $nextDueDate->addWeeks($interval); break;
                case 'monthly': $nextDueDate->addMonths($interval); break;
                case 'yearly': $nextDueDate->addYears($interval); break;
            }
        }
        
        // Check against end date
        if ($template->schedule_end_date && $nextDueDate->gt($template->schedule_end_date)) {
            $nextDueDate = null; // Stop scheduling
        }
        
        $template->schedule_next_due_date = $nextDueDate;
        $template->save();
        
        $this->info("  Recalculated overdue template. New next due: " . ($nextDueDate ? $nextDueDate->toDateTimeString() : 'None (template ended)'));
    }

    /**
     * Generate a meaningful name for the inspection instance.
     */
    protected function generateInstanceName(Inspection $template): string
    {
        $dueDate = $template->schedule_next_due_date;
        $templateName = $template->name;
        
        switch ($template->schedule_frequency) {
            case 'minute':
                // "Template Name - Aug 21 09:46"
                return "{$templateName} - " . $dueDate->format('M d H:i');
                
            case 'daily':
                // "Template Name - Aug 21"
                return "{$templateName} - " . $dueDate->format('M d');
                
            case 'weekly':
                // "Template Name - Week of Aug 21"
                $weekStart = $dueDate->copy()->startOfWeek();
                return "{$templateName} - Week of " . $weekStart->format('M d');
                
            case 'monthly':
                // "Template Name - August 2025"
                return "{$templateName} - " . $dueDate->format('F Y');
                
            case 'yearly':
                // "Template Name - 2025"
                return "{$templateName} - " . $dueDate->format('Y');
                
            default:
                // Fallback to date format
                return "{$templateName} - " . $dueDate->format('M d, Y');
        }
    }

    /**
     * Calculate and update the next due date for a template.
     */
    protected function updateTemplateNextDueDate(Inspection $template, Carbon $now): void
    {
         $frequency = $template->schedule_frequency;
         $interval = $template->schedule_interval;
         $startDate = $template->schedule_start_date;
         $currentNextDueDate = $template->schedule_next_due_date;

         $newNextDueDate = null;
         if ($frequency && $interval && $startDate && $currentNextDueDate) {
             $baseDate = $currentNextDueDate->copy(); // Use the date that just passed as base
             switch ($frequency) {
                 case 'minute': $newNextDueDate = $baseDate->addMinutes($interval); break;
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

    /**
     * Check if an instance already exists for the given template and due date.
     */
    protected function checkIfInstanceAlreadyExists(Inspection $template): bool
    {
        $dueDate = $template->schedule_next_due_date;
        
        if ($template->schedule_frequency === 'minute') {
            // For minute-based templates, check by exact timestamp to avoid false duplicates
            $startOfMinute = $dueDate->copy()->startOfMinute();
            $endOfMinute = $dueDate->copy()->endOfMinute();
            
            return Inspection::where('parent_inspection_id', $template->id)
                ->whereBetween('created_at', [$startOfMinute, $endOfMinute])
                ->exists();
        } else {
            // For other frequencies, check by due date to avoid duplicates
            return Inspection::where('parent_inspection_id', $template->id)
                ->whereDate('expiry_date', $dueDate->toDateString())
                ->exists();
        }
    }

    /**
     * Log a summary of what was processed by frequency.
     */
    protected function logProcessingSummary($dueTemplates, int $createdCount): void
    {
        $frequencyBreakdown = $dueTemplates->groupBy('schedule_frequency')
            ->map(function ($templates, $frequency) {
                return [
                    'frequency' => $frequency,
                    'count' => $templates->count(),
                    'names' => $templates->pluck('name')->toArray()
                ];
            });

        $this->info("\nProcessing Summary by Frequency:");
        foreach ($frequencyBreakdown as $breakdown) {
            $this->line("  {$breakdown['frequency']}: {$breakdown['count']} templates");
            foreach ($breakdown['names'] as $name) {
                $this->line("    - {$name}");
            }
        }

        // Log to file for monitoring
        Log::info("Processing summary", [
            'total_templates_checked' => $dueTemplates->count(),
            'instances_created' => $createdCount,
            'frequency_breakdown' => $frequencyBreakdown->toArray()
        ]);
    }
}
