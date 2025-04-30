<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Part;
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
        
        return redirect()->route('parts')->with('success', 'Part created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Part $part)
    {
        return Inertia::render('parts', [
            'selectedPart' => $part->load('drive:id,name,drive_ref'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Part $part)
    {
        $validated = $request->validate(Part::updateValidationRules($part->id));
        
        // If status is unattached, make sure drive_id is null
        if ($validated['status'] === 'unattached') {
            $validated['drive_id'] = null;
        }
        
        // If status is attached, make sure drive_id is not null
        if ($validated['status'] === 'attached' && empty($validated['drive_id'])) {
            return back()->withErrors(['drive_id' => 'A drive must be selected when status is attached']);
        }
        
        $part->update($validated);
        
        return redirect()->route('parts')->with('success', 'Part updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Part $part)
    {
        $part->delete();
        
        return redirect()->route('parts')->with('success', 'Part deleted successfully');
    }
}
