<?php

namespace App\Console\Commands;

use App\Models\Inspection;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckExpiredInspections extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspections:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for expired inspections and mark them as expired with performance penalties';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired inspections...');

        // Find inspections that have expired but haven't been marked as expired yet
        $expiredInspections = Inspection::where('status', '!=', 'completed')
            ->where('status', '!=', 'archived')
            ->where('is_expired', false)
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', now())
            ->get();

        $count = 0;
        foreach ($expiredInspections as $inspection) {
            try {
                $inspection->markAsExpired();
                $count++;
                
                $this->line("Marked inspection '{$inspection->name}' as expired");
                
                // Log the expiration for audit purposes
                Log::info("Inspection {$inspection->id} marked as expired", [
                    'inspection_id' => $inspection->id,
                    'name' => $inspection->name,
                    'operator_id' => $inspection->operator_id,
                    'expired_at' => $inspection->expired_at,
                    'performance_penalty' => $inspection->performance_penalty
                ]);
                
            } catch (\Exception $e) {
                $this->error("Failed to mark inspection {$inspection->id} as expired: " . $e->getMessage());
                Log::error("Failed to mark inspection as expired", [
                    'inspection_id' => $inspection->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->info("Processed {$count} expired inspections");

        // Also check for inspections that are about to expire (within 24 hours)
        $criticalInspections = Inspection::where('status', '!=', 'completed')
            ->where('status', '!=', 'archived')
            ->where('is_expired', false)
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDay())
            ->get();

        if ($criticalInspections->count() > 0) {
            $this->warn("Found {$criticalInspections->count()} inspections expiring within 24 hours:");
            foreach ($criticalInspections as $inspection) {
                $hoursUntilExpiry = now()->diffInHours($inspection->expiry_date, false);
                $this->line("  - {$inspection->name} expires in {$hoursUntilExpiry} hours");
            }
        }

        return 0;
    }
}

