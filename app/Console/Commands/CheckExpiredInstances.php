<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inspection;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CheckExpiredInstances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspections:check-expired-instances';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for expired inspection instances and update their status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $this->info("Running CheckExpiredInstances command at {$now->toDateTimeString()}");
        Log::info('Running CheckExpiredInstances command.', ['timestamp' => $now->toISOString()]);

        // Find expired instances that are still active
        $expiredInstances = Inspection::where('is_template', false)
            ->where('status', 'active')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $now)
            ->get();

        // Also find instances that should be marked as completed (all tasks done)
        $completedInstances = Inspection::where('is_template', false)
            ->where('status', 'active')
            ->whereHas('tasks', function($query) {
                $query->whereDoesntHave('results');
            }, '=', 0) // No tasks without results
            ->get();

        $totalInstances = $expiredInstances->count() + $completedInstances->count();
        
        if ($totalInstances === 0) {
            $this->info('No instances to process.');
            Log::info('No instances to process.');
            return 0;
        }

        $this->info("Found {$expiredInstances->count()} expired instances and {$completedInstances->count()} completed instances to process.");

        $updatedCount = 0;
        foreach ($expiredInstances as $instance) {
            $this->info("Processing expired instance ID: {$instance->id} - {$instance->name}");

            try {
                DB::beginTransaction();

                // Update instance status to expired
                $instance->update([
                    'status' => 'expired',
                    'expired_at' => $now,
                    'is_expired' => true, // Set the is_expired flag
                ]);

                // Calculate performance penalty based on how long it's been expired
                $hoursExpired = $now->diffInHours($instance->expiry_date);
                $penalty = $this->calculatePerformancePenalty($hoursExpired);
                
                if ($penalty > 0) {
                    $instance->update([
                        'performance_penalty' => $penalty
                    ]);
                }

                $this->info("  Updated instance status to 'expired'");
                $this->info("  Performance penalty: {$penalty} points");
                
                // Log the expiration
                Log::info("Instance marked as expired", [
                    'instance_id' => $instance->id,
                    'name' => $instance->name,
                    'expired_at' => $instance->expired_at,
                    'performance_penalty' => $penalty,
                    'hours_expired' => $hoursExpired
                ]);

                DB::commit();
                $updatedCount++;

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Failed to process expired instance ID: {$instance->id}. Error: {$e->getMessage()}");
                Log::error("Failed to process expired instance ID: {$instance->id}", [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        // Process completed instances
        $completedCount = 0;
        foreach ($completedInstances as $instance) {
            $this->info("Processing completed instance ID: {$instance->id} - {$instance->name}");

            try {
                DB::beginTransaction();

                // Update instance status to completed
                $instance->update([
                    'status' => 'completed',
                    'completed_by' => $instance->operator_id, // Set as completed by operator
                ]);

                $this->info("  Updated instance status to 'completed'");
                
                // Log the completion
                Log::info("Instance marked as completed", [
                    'instance_id' => $instance->id,
                    'name' => $instance->name,
                    'completed_by' => $instance->operator_id,
                    'completed_at' => $now
                ]);

                DB::commit();
                $completedCount++;

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Failed to process completed instance ID: {$instance->id}. Error: {$e->getMessage()}");
                Log::error("Failed to process completed instance ID: {$instance->id}", [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        $this->info("Finished processing instances. Updated {$updatedCount} expired instances and {$completedCount} completed instances.");
        
        // Log summary
        Log::info("CheckExpiredInstances command finished. Updated {$updatedCount} expired instances and {$completedCount} completed instances.");
        
        return 0;
    }

    /**
     * Calculate performance penalty based on how long the instance has been expired.
     */
    protected function calculatePerformancePenalty(int $hoursExpired): int
    {
        if ($hoursExpired <= 1) {
            return 5; // 5 points for expired less than 1 hour
        } elseif ($hoursExpired <= 4) {
            return 10; // 10 points for expired 1-4 hours
        } elseif ($hoursExpired <= 24) {
            return 25; // 25 points for expired 1-24 hours
        } else {
            return 50; // 50 points for expired more than 24 hours
        }
    }
}
