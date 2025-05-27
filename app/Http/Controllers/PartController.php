<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Part;
use App\Models\PartAttachmentHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

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
        
        $drives = Drive::select('id', 'name', 'drive_ref')
            ->orderBy('name')
            ->get();
        
        return Inertia::render('part/show', [
            'part' => $part->load('drive:id,name,drive_ref'),
            'attachmentHistory' => $attachmentHistory,
            'drives' => $drives,
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

    /**
     * Update the attachment status of a part
     */
    public function updateAttachment(Request $request, Part $part)
    {
        $validated = $request->validate([
            'status' => 'required|in:attached,unattached',
            'drive_id' => 'nullable|exists:drives,id',
            'attachment_notes' => 'nullable|string',
        ]);
        
        // Get current values
        $oldStatus = $part->status;
        $oldDriveId = $part->drive_id;
        $newStatus = $validated['status'];
        $newDriveId = $validated['drive_id'] ?? null;
        
        // If status is unattached, make sure drive_id is null
        if ($newStatus === 'unattached') {
            $newDriveId = null;
        }
        
        // If status is attached, make sure drive_id is not null
        if ($newStatus === 'attached' && empty($newDriveId)) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'errors' => ['drive_id' => 'A drive must be selected when status is attached']
                ], 422);
            }
            return back()->withErrors(['drive_id' => 'A drive must be selected when status is attached']);
        }
        
        // Record history changes based on what changed
        // Case 1: Previously unattached, now attached to a drive
        if ($oldStatus === 'unattached' && $newStatus === 'attached') {
            $part->recordAttachmentAction(
                'attached',
                $newDriveId,
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
        else if ($oldStatus === 'attached' && $newStatus === 'attached' && $oldDriveId != $newDriveId) {
            // Record detachment from old drive
            $part->recordAttachmentAction(
                'detached',
                $oldDriveId,
                $request->input('attachment_notes', 'Part moved to another drive')
            );
            
            // Record attachment to new drive
            $part->recordAttachmentAction(
                'attached',
                $newDriveId,
                $request->input('attachment_notes', 'Part moved from another drive')
            );
        }
        
        // Update the part with new status and drive_id
        $part->status = $newStatus;
        $part->drive_id = $newDriveId;
        $part->save();
        
        $message = $newStatus === 'attached' 
            ? 'Part successfully attached to drive'
            : 'Part successfully detached from drive';
            
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'part' => $part->load('drive:id,name,drive_ref')
            ]);
        }
        
        return back()->with('success', $message);
    }

    /**
     * Get all parts that are not attached to any drive.
     */
    public function getUnattachedParts()
    {
        $unattachedParts = Part::where('status', 'unattached')
            ->orWhereNull('drive_id')
            ->orderBy('name')
            ->get();
        
        return response()->json($unattachedParts);
    }

    /**
     * Import parts from a CSV file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);
        
        $file = $request->file('file');
        $path = $file->getRealPath();
        
        // Log file information
        Log::info('Importing parts from CSV', [
            'filename' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType()
        ]);
        
        // Open file
        $handle = fopen($path, 'r');
        if (!$handle) {
            Log::error('Failed to open CSV file');
            return $this->returnImportResponse($request, false, 0, ['Failed to open CSV file']);
        }
        
        // Read header row to detect columns
        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            Log::error('CSV file is empty or could not be parsed');
            return $this->returnImportResponse($request, false, 0, ['CSV file is empty or invalid format']);
        }
        
        // Normalize headers (lowercase, trim, etc)
        $normalizedHeaders = [];
        foreach ($headers as $header) {
            $normalizedHeaders[] = trim(strtolower(str_replace([' ', '_', '-'], '', $header)));
        }
        
        // Map the expected column names to their normalized versions
        $columnMap = [
            'partnumber' => ['partnumber', 'partno', 'partref', 'reference', 'part#'],
            'partdescription' => ['partdescription', 'partname', 'name', 'description'],
            'notes' => ['notes', 'note', 'comments', 'comment'],
        ];
        
        // Find column indexes based on flexible matching
        $columnIndexes = [];
        foreach ($columnMap as $field => $possibleHeaders) {
            $foundIndex = -1;
            foreach ($possibleHeaders as $possibleHeader) {
                $index = array_search($possibleHeader, $normalizedHeaders);
                if ($index !== false) {
                    $foundIndex = $index;
                    break;
                }
            }
            $columnIndexes[$field] = $foundIndex;
        }
        
        // Verify required columns exist
        if ($columnIndexes['partnumber'] === -1) {
            fclose($handle);
            Log::error('Required column "Part Number" not found in CSV');
            return $this->returnImportResponse(
                $request, 
                false, 
                0, 
                ['Required column "Part Number" not found. The column header should be "Part Number", "Part No", "Part Ref", "Reference", or similar.']
            );
        }
        
        if ($columnIndexes['partdescription'] === -1) {
            fclose($handle);
            Log::error('Required column "Part Description" not found in CSV');
            return $this->returnImportResponse(
                $request, 
                false, 
                0, 
                ['Required column "Part Description" not found. The column header should be "Part Description", "Part Name", "Name", "Description", or similar.']
            );
        }
        
        // Process CSV rows
        $row = 1; // Header was row 0
        $imported = 0;
        $errors = [];
        $newParts = [];
        
        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            
            // Skip empty rows
            if (empty(array_filter($data))) {
                continue;
            }
            
            // Extract values using column indexes
            $partRef = $columnIndexes['partnumber'] !== -1 ? trim($data[$columnIndexes['partnumber']]) : null;
            $partName = $columnIndexes['partdescription'] !== -1 ? trim($data[$columnIndexes['partdescription']]) : null;
            $notes = $columnIndexes['notes'] !== -1 ? trim($data[$columnIndexes['notes']]) : null;
            
            // Validate required fields
            if (empty($partRef)) {
                $errors[] = "Row {$row}: Part Number is required";
                continue;
            }
            
            if (empty($partName)) {
                $errors[] = "Row {$row}: Part Description is required";
                continue;
            }
            
            // Check if part with same reference already exists
            $existingPart = Part::where('part_ref', $partRef)->first();
            if ($existingPart) {
                $errors[] = "Row {$row}: Part with reference '{$partRef}' already exists";
                continue;
            }
            
            // Create new part
            try {
                $part = new Part();
                $part->part_ref = $partRef;
                $part->name = $partName;
                $part->notes = $notes;
                $part->status = 'unattached';
                $part->save();
                
                $newParts[] = $part;
                $imported++;
            } catch (\Exception $e) {
                Log::error('Error creating part from CSV', [
                    'row' => $row,
                    'part_ref' => $partRef,
                    'error' => $e->getMessage()
                ]);
                $errors[] = "Row {$row}: Error creating part - {$e->getMessage()}";
            }
        }
        
        fclose($handle);
        
        Log::info('CSV import completed', [
            'total_rows' => $row - 1, // Excluding header
            'imported' => $imported,
            'errors' => count($errors)
        ]);
        
        return $this->returnImportResponse($request, true, $imported, $errors);
    }
    
    /**
     * Helper method to return consistent import responses
     */
    private function returnImportResponse(Request $request, bool $success, int $imported, array $errors)
    {
        $result = [
            'success' => $success,
            'imported' => $imported,
            'errors' => $errors,
        ];
        
        // Return response based on request type
        if ($request->wantsJson()) {
            return response()->json($result);
        }
        
        // For Inertia requests, return to the parts page with flash data
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
        
        if (!$success) {
            return Inertia::render('parts', [
                'parts' => $parts,
                'drives' => $drives,
                'flash' => [
                    'error' => !empty($errors) ? $errors[0] : 'Import failed',
                    'import_result' => $result
                ]
            ]);
        }
        
        // If there were errors, still show success but include error details
        if (!empty($errors)) {
            $errorSummary = count($errors) . ' error' . (count($errors) > 1 ? 's' : '') . ' occurred during import';
            
            return Inertia::render('parts', [
                'parts' => $parts,
                'drives' => $drives,
                'flash' => [
                    'success' => "Imported {$imported} parts with some issues",
                    'error' => $errorSummary,
                    'import_result' => $result
                ]
            ]);
        }
        
        // For successful import
        return Inertia::render('parts', [
            'parts' => $parts,
            'drives' => $drives,
            'flash' => [
                'success' => "Successfully imported {$imported} parts",
                'import_result' => $result
            ]
        ]);
    }
    
    /**
     * Download a CSV template for parts import
     * 
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function downloadImportTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="parts_import_template.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() {
            $file = fopen('php://output', 'w');
            
            // Add CSV header row
            fputcsv($file, ['Part Number', 'Part Description']);
            
            // Add a sample row (optional)
            fputcsv($file, ['PART-001', 'Sample Part Name']);
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
