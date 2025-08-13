<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
        
        // Schedule the inspection creation command
        $schedule->command('inspections:create-scheduled')->daily()->withoutOverlapping(); 
        // Consider ->hourly() or more frequent if needed, withoutOverlapping() prevents duplicates if a run takes longer than the interval.
        
        // Schedule operator performance check - runs daily at 8 AM
        $schedule->command('operators:check-performance')->daily()->at('08:00')->withoutOverlapping();
        
        // Schedule handout notes archiving - runs every Sunday at 1 AM
        $schedule->command('handout-notes:archive')->weekly()->sundays()->at('01:00')->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
} 