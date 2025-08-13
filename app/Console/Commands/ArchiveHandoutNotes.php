<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\HandoutNote;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ArchiveHandoutNotes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'handout-notes:archive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive handout notes from the previous week (Sunday to Saturday)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting handout notes archive process...');
        
        // Calculate the previous week's Sunday (start of week)
        $previousWeekStart = Carbon::now()->subWeek()->startOfWeek(Carbon::SUNDAY);
        $previousWeekEnd = $previousWeekStart->copy()->addDays(6)->endOfDay();
        
        $this->info("Archiving notes from {$previousWeekStart->format('Y-m-d')} to {$previousWeekEnd->format('Y-m-d')}");
        
        // Get notes from the previous week
        $notesToArchive = HandoutNote::whereBetween('created_at', [
            $previousWeekStart->format('Y-m-d H:i:s'),
            $previousWeekEnd->format('Y-m-d H:i:s')
        ])->get();
        
        $count = $notesToArchive->count();
        
        if ($count === 0) {
            $this->info('No notes found to archive for the previous week.');
            return 0;
        }
        
        $this->info("Found {$count} notes to archive.");
        
        // Log the archiving process
        Log::info("Archiving {$count} handout notes from week {$previousWeekStart->format('Y-m-d')} to {$previousWeekEnd->format('Y-m-d')}");
        
        // Display summary of notes being archived
        $this->table(
            ['ID', 'Title', 'Category', 'User', 'Created At'],
            $notesToArchive->map(function ($note) {
                return [
                    $note->id,
                    $note->title,
                    $note->category,
                    $note->user->name ?? 'Unknown',
                    $note->created_at->format('Y-m-d H:i:s')
                ];
            })->toArray()
        );
        
        $this->info("Successfully identified {$count} notes for archiving.");
        $this->info('Note: Notes are automatically filtered by creation date in the application.');
        $this->info('This command serves as a log of the archiving process.');
        
        return 0;
    }
}
