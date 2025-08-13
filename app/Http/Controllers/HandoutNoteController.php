<?php

namespace App\Http\Controllers;

use App\Models\HandoutNote;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class HandoutNoteController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Calculate the current week's Sunday (start of week)
        $currentWeekStart = Carbon::now()->startOfWeek(Carbon::SUNDAY);
        
        // Get current week notes (from Sunday to Saturday) with comments
        $currentNotes = HandoutNote::with(['user:id,name', 'comments.user:id,name'])
            ->where('created_at', '>=', $currentWeekStart)
            ->get()
            ->map(function ($note) {
                // Calculate the most recent activity timestamp
                $latestComment = $note->comments->sortByDesc('created_at')->first();
                $note->most_recent_activity = $latestComment && $latestComment->created_at > $note->updated_at 
                    ? $latestComment->created_at 
                    : $note->updated_at;
                return $note;
            })
            ->sortByDesc('most_recent_activity')
            ->groupBy('category');
        
        // Get archived notes (from previous weeks) with comments
        $archivedNotes = HandoutNote::with(['user:id,name', 'comments.user:id,name'])
            ->where('created_at', '<', $currentWeekStart)
            ->get()
            ->map(function ($note) {
                // Calculate the most recent activity timestamp
                $latestComment = $note->comments->sortByDesc('created_at')->first();
                $note->most_recent_activity = $latestComment && $latestComment->created_at > $note->updated_at 
                    ? $latestComment->created_at 
                    : $note->updated_at;
                return $note;
            })
            ->sortByDesc('most_recent_activity')
            ->groupBy('category');
        
        // Add archive metadata
        $archiveInfo = [
            'current_week_start' => $currentWeekStart->format('Y-m-d'),
            'current_week_end' => $currentWeekStart->copy()->addDays(6)->format('Y-m-d'),
            'total_current_notes' => $currentNotes->flatten(1)->count(),
            'total_archived_notes' => $archivedNotes->flatten(1)->count(),
        ];

        return Inertia::render('handout-notes', [
            'currentNotes' => $currentNotes,
            'archivedNotes' => $archivedNotes,
            'archiveInfo' => $archiveInfo,
            'currentUser' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:1000',
            'category' => 'required|in:electrical,mechanical,hydraulic,workshop,utilities',
        ]);

        $note = HandoutNote::create([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Note created successfully.');
    }

    public function update(Request $request, HandoutNote $handoutNote)
    {
        // Ensure user can only update their own notes
        if ($handoutNote->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:1000',
            'category' => 'required|in:electrical,mechanical,hydraulic,workshop,utilities',
        ]);

        $handoutNote->update([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
        ]);

        return redirect()->back()->with('success', 'Note updated successfully.');
    }

    public function destroy(HandoutNote $handoutNote)
    {
        // Ensure user can only delete their own notes
        if ($handoutNote->user_id !== auth()->id()) {
            abort(403);
        }

        $handoutNote->delete();

        return redirect()->back()->with('success', 'Note deleted successfully.');
    }
}
