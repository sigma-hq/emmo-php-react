<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Inspection;
use App\Models\Part;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $inspections = Inspection::with('creator:id,name')
            ->when($request->input('search'), function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
            
        return Inertia::render('inspections', [
            'inspections' => $inspections,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate(Inspection::validationRules());
        
        // Add the current user as creator
        $validated['created_by'] = auth()->id();
        
        $inspection = Inspection::create($validated);
        
        return redirect()->route('inspections')->with('success', 'Inspection created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Inspection $inspection)
    {
        $inspection->load([
            'creator:id,name',
            'tasks' => function($query) {
                $query->with(['results' => function($query) {
                    $query->with('performer:id,name');
                }]);
            }
        ]);
        
        // Get drives and parts for task creation/editing
        $drives = Drive::select('id', 'name', 'drive_ref')->get();
        $parts = Part::select('id', 'name', 'part_ref')->get();
        
        return Inertia::render('inspection/show', [
            'inspection' => $inspection,
            'drives' => $drives,
            'parts' => $parts,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Inspection $inspection)
    {
        $validated = $request->validate(Inspection::updateValidationRules($inspection->id));
        
        $inspection->update($validated);
        
        return redirect()->route('inspections')->with('success', 'Inspection updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Inspection $inspection)
    {
        $inspection->delete();
        
        return redirect()->route('inspections')->with('success', 'Inspection deleted successfully');
    }
}
