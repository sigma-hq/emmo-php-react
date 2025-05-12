<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class DriveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $drives = Drive::withCount('parts')
            ->when($request->input('search'), function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('drive_ref', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
        
        return Inertia::render('drive', [
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
        $validated = $request->validate(Drive::validationRules());
        
        $drive = Drive::create($validated);
        
        return redirect()->route('drive')->with('success', 'Drive created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Drive $drive)
    {
        $drive->load([
            'parts' => function($query) {
                $query->latest();
            }
        ]);
        $operators = User::where('role', 'operator')->select('id', 'name')->get();
        return Inertia::render('drive/show', [
            'drive' => $drive,
            'operators' => $operators,
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
    public function update(Request $request, Drive $drive)
    {
        $validated = $request->validate(Drive::updateValidationRules($drive->id));
        
        $drive->update($validated);
        
        return redirect()->route('drive')->with('success', 'Drive updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Drive $drive)
    {
        $drive->delete();
        
        return redirect()->route('drive')->with('success', 'Drive deleted successfully');
    }
}
