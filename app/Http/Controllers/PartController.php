<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Part;
use App\Models\PartAttachmentHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PartController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $parts = Part::with('drive:id,name,drive_ref')
            ->when($request->input('search'), function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('part_ref', 'like', "%{$search}%")
                    ->orWhereHas('drive', function($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('drive_ref', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
            
        $drives = Drive::select('id', 'name', 'drive_ref')
            ->orderBy('name')
            ->get();
        
        return Inertia::render('parts', [
            'parts' => $parts,
            'drives' => $drives,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate(Part::validationRules());
        
        // If status is unattached, make sure drive_id is null
        if ($validated['status'] === 'unattached') {
            $validated['drive_id'] = null;
        }
        
        // If status is attached, make sure drive_id is not null
        if ($validated['status'] === 'attached' && empty($validated['drive_id'])) {
            return back()->withErrors(['drive_id' => 'A drive must be selected when status is attached']);
        }
        
        $part = Part::create($validated);
        
        // Record the attachment history if attached to a drive
        if ($validated['status'] === 'attached') {
            $part->recordAttachmentAction(
                'attached',
                $validated['drive_id'],
                $request->input('notes', 'Initial attachment')
            );
        }
        
        return redirect()->route('parts')->with('success', 'Part created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Part $part)
    {
        $attachmentHistory = $part->attachmentHistory()
            ->with(['drive:id,name,drive_ref', 'user:id,name'])
            ->get();
        
        return Inertia::render('part/show', [
            'part' => $part->load('drive:id,name,drive_ref'),
            'attachmentHistory' => $attachmentHistory,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Part $part)
    {
        return redirect()->route('parts', [
            'editPart' => $part->id,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Part $part)
    {
        $validated = $request->validate(Part::updateValidationRules($part->id));
        
        // Check for attachment/detachment changes
        $oldStatus = $part->status;
        $oldDriveId = $part->drive_id;
        $newStatus = $validated['status'];
        
        // If status is unattached, make sure drive_id is null
        if ($newStatus === 'unattached') {
            $validated['drive_id'] = null;
        }
        
        // If status is attached, make sure drive_id is not null
        if ($newStatus === 'attached' && empty($validated['drive_id'])) {
            return back()->withErrors(['drive_id' => 'A drive must be selected when status is attached']);
        }
        
        // Record history changes
        // Case 1: Previously unattached, now attached to a drive
        if ($oldStatus === 'unattached' && $newStatus === 'attached') {
            $part->recordAttachmentAction(
                'attached',
                $validated['drive_id'],
                $request->input('attachment_notes', 'Part attached to drive')
            );
        }
        // Case 2: Previously attached to a drive, now detached
        else if ($oldStatus === 'attached' && $newStatus === 'unattached') {
            $part->recordAttachmentAction(
                'detached',
                $oldDriveId,
                $request->input('attachment_notes', 'Part detached from drive')
            );
        }
        // Case 3: Changed from one drive to another
        else if ($oldStatus === 'attached' && $newStatus === 'attached' && $oldDriveId != $validated['drive_id']) {
            // Record detachment from old drive
            $part->recordAttachmentAction(
                'detached',
                $oldDriveId,
                $request->input('attachment_notes', 'Part moved to another drive')
            );
            
            // Record attachment to new drive
            $part->recordAttachmentAction(
                'attached',
                $validated['drive_id'],
                $request->input('attachment_notes', 'Part moved from another drive')
            );
        }
        
        $part->update($validated);
        
        return redirect()->route('parts')->with('success', 'Part updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Part $part)
    {
        // If part is attached to a drive, record detachment before deletion
        if ($part->status === 'attached' && $part->drive_id) {
            $part->recordAttachmentAction(
                'detached', 
                $part->drive_id,
                'Part removed from system'
            );
        }
        
        $part->delete();
        
        return redirect()->route('parts')->with('success', 'Part deleted successfully');
    }

    /**
     * Get the attachment history for a specific part.
     */
    public function getAttachmentHistory(Part $part)
    {
        $history = $part->attachmentHistory()
            ->with(['drive:id,name,drive_ref', 'user:id,name'])
            ->get();
        
        return response()->json($history);
    }
}
