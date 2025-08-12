<?php

namespace App\Http\Controllers;

use App\Models\HandoutNote;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HandoutNoteController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Load all notes with user information and comments, ordered by creation date
        $notes = HandoutNote::with(['user:id,name', 'comments.user:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('category');

        return Inertia::render('handout-notes', [
            'notes' => $notes,
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
