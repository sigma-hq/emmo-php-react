<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inspection;
use Carbon\Carbon;

class TestScheduler extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scheduler:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the dynamic scheduler to see what templates would be processed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $this->info("Testing Dynamic Scheduler at {$now->toDateTimeString()}");
        $this->line("Current minute: {$now->minute}");
        $this->line("Minute % 15: " . ($now->minute % 15));
        $this->line("Minute === 0: " . ($now->minute === 0 ? 'true' : 'false'));
        
        $this->line("\n" . str_repeat('─', 50));
        
        // Show all templates
        $templates = Inspection::where('is_template', true)->get();
        
        if ($templates->isEmpty()) {
            $this->warn("No templates found!");
            return 0;
        }
        
        $this->info("Found {$templates->count()} templates:");
        
        foreach ($templates as $template) {
            $this->line("\n📋 {$template->name}");
            $this->line("   Frequency: {$template->schedule_frequency} every {$template->schedule_interval}");
            $this->line("   Next Due: " . ($template->schedule_next_due_date ? $template->schedule_next_due_date->toDateTimeString() : 'Not set'));
            $this->line("   Status: {$template->status}");
            
            // Check if it would be processed now
            $wouldProcess = $this->wouldTemplateBeProcessed($template, $now);
            $this->line("   Would Process: " . ($wouldProcess ? '✅ YES' : '❌ NO'));
        }
        
        $this->line("\n" . str_repeat('─', 50));
        $this->info("Scheduler Test Complete!");
        
        return 0;
    }
    
    /**
     * Check if a template would be processed at the given time.
     */
    protected function wouldTemplateBeProcessed(Inspection $template, Carbon $now): bool
    {
        if (!$template->schedule_next_due_date || $template->schedule_next_due_date->gt($now)) {
            return false;
        }
        
        // Check end date
        if ($template->schedule_end_date && $template->schedule_end_date->lte($now)) {
            return false;
        }
        
        // Minute-based templates are always checked
        if ($template->schedule_frequency === 'minute') {
            return true;
        }
        
        // Other frequencies are now always checked (fixed scheduling issue)
        if (in_array($template->schedule_frequency, ['daily', 'weekly', 'monthly', 'yearly'])) {
            return true;
        }
        
        return false;
    }
}
