<?php

namespace App\Console\Commands;

use App\Models\OperatorPerformance;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckOperatorPerformance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'operators:check-performance {--days=30 : Number of days to analyze}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check operator performance and create alerts for admins';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting operator performance check...');
        
        $periodDays = $this->option('days');
        $startTime = now();
        
        try {
            // Get all operators
            $operators = User::where('role', 'operator')->get();
            $this->info("Found {$operators->count()} operators to analyze.");
            
            $performanceRecords = [];
            $usersNeedingAttention = [];
            
            foreach ($operators as $operator) {
                $this->line("Analyzing performance for operator: {$operator->name}");
                
                // Calculate performance metrics
                $metrics = OperatorPerformance::calculateForUser($operator, $periodDays);
                
                // Create or update performance record
                $performance = OperatorPerformance::updateOrCreate(
                    [
                        'user_id' => $operator->id,
                        'period_start' => $metrics['period_start'],
                        'period_end' => $metrics['period_end'],
                    ],
                    $metrics
                );
                
                $performanceRecords[] = $performance;
                
                // Check if user needs attention
                if (in_array($metrics['status'], ['warning', 'critical', 'inactive'])) {
                    $usersNeedingAttention[] = $performance;
                    
                    $this->warn("⚠️  {$operator->name} needs attention: {$metrics['status']} - {$metrics['notes']}");
                } else {
                    $this->info("✅ {$operator->name} is performing well: {$metrics['performance_score']}%");
                }
            }
            
            // Create admin alerts if needed
            if (!empty($usersNeedingAttention)) {
                $this->createAdminAlerts($usersNeedingAttention);
                $this->warn("Created alerts for " . count($usersNeedingAttention) . " operators needing attention.");
            }
            
            $duration = now()->diffInSeconds($startTime);
            $this->info("Performance check completed in {$duration} seconds.");
            $this->info("Created/updated " . count($performanceRecords) . " performance records.");
            
            // Log the results
            Log::info('Operator performance check completed', [
                'total_operators' => $operators->count(),
                'users_needing_attention' => count($usersNeedingAttention),
                'duration_seconds' => $duration,
                'period_days' => $periodDays,
            ]);
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error("Error during performance check: " . $e->getMessage());
            Log::error('Operator performance check failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return Command::FAILURE;
        }
    }
    
    /**
     * Create admin alerts for users needing attention
     */
    private function createAdminAlerts(array $performances): void
    {
        // Get all admin users
        $admins = User::where('role', 'admin')->get();
        
        if ($admins->isEmpty()) {
            Log::warning('No admin users found to send performance alerts to');
            return;
        }
        
        // Group performances by status for better organization
        $criticalUsers = collect($performances)->where('status', 'critical');
        $warningUsers = collect($performances)->where('status', 'warning');
        $inactiveUsers = collect($performances)->where('status', 'inactive');
        
        foreach ($admins as $admin) {
            try {
                // Send email alert (you can customize this)
                $this->sendPerformanceAlertEmail($admin, $criticalUsers, $warningUsers, $inactiveUsers);
                
                // You could also send in-app notifications, Slack messages, etc.
                
            } catch (\Exception $e) {
                Log::error('Failed to send performance alert to admin', [
                    'admin_id' => $admin->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
    
    /**
     * Send performance alert email to admin
     */
    private function sendPerformanceAlertEmail(User $admin, $criticalUsers, $warningUsers, $inactiveUsers): void
    {
        // For now, we'll just log the alert
        // In a real implementation, you'd send an email or notification
        Log::info('Performance alert for admin', [
            'admin_id' => $admin->id,
            'admin_name' => $admin->name,
            'critical_users_count' => $criticalUsers->count(),
            'warning_users_count' => $warningUsers->count(),
            'inactive_users_count' => $inactiveUsers->count(),
        ]);
        
        // TODO: Implement actual email sending
        // Mail::to($admin->email)->send(new OperatorPerformanceAlert($criticalUsers, $warningUsers, $inactiveUsers));
    }
}
