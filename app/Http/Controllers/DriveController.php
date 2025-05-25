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
            },
            'maintenances' => function($query) {
                $query->with('user:id,name')->latest();
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

    /**
     * Import drives from a CSV file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);
        
        $file = $request->file('file');
        $path = $file->getRealPath();
        
        // Log file information for debugging
        \Log::info('CSV Import started', [
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'path' => $path
        ]);
        
        // Read the file content and ensure proper UTF-8 encoding
        $content = file_get_contents($path);
        
        // Detect and convert encoding if needed
        $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if ($encoding !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            \Log::info("Converted file encoding from {$encoding} to UTF-8");
        }
        
        // Create a temporary file with proper UTF-8 content
        $tempFile = tempnam(sys_get_temp_dir(), 'csv_import_');
        file_put_contents($tempFile, $content);
        
        // Open the temporary file
        $handle = fopen($tempFile, 'r');
        
        if (!$handle) {
            // Clean up temporary file
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
            \Log::error('Failed to open CSV file');
            return $this->returnImportResponse($request, false, 0, ['Failed to open CSV file']);
        }
        
        // Read through the file to find the actual header row
        $header = null;
        $headerRowIndex = 0;
        $maxRowsToCheck = 10; // Don't check more than 10 rows for headers
        
        while (($row = fgetcsv($handle)) !== false && $headerRowIndex < $maxRowsToCheck) {
            $headerRowIndex++;
            
            // Look for a row that contains "Drive Number" and "Drive Description"
            if ($row && is_array($row)) {
                $rowString = implode(',', array_map('strtolower', array_map('trim', $row)));
                if (strpos($rowString, 'drive number') !== false && strpos($rowString, 'drive description') !== false) {
                    $header = $row;
                    \Log::info("Found header row at line {$headerRowIndex}:", $header);
                    break;
                }
            }
        }
        
        if (!$header) {
            fclose($handle);
            // Clean up temporary file
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
            \Log::error('Could not find valid header row with Drive Number and Drive Description');
            return $this->returnImportResponse($request, false, 0, ['Could not find valid header row. Please ensure your CSV contains columns named "Drive Number" and "Drive Description".']);
        }
        
        // Log the header for debugging
        \Log::info('CSV Header found:', $header);
        
        // Map header fields to expected names (case-insensitive matching)
        $headerMap = [];
        $expectedFields = [
            // Multiple possible variations for each field
            'Item Number' => null, // We don't use this field
            'Drive Number' => 'drive_ref',
            'Drive Description' => 'name',
            'Area' => 'location',
            'Item' => 'notes',
            // Additional variations
            'Drive Ref' => 'drive_ref',
            'Reference' => 'drive_ref',
            'Ref' => 'drive_ref',
            'Name' => 'name',
            'Description' => 'name',
            'Drive Name' => 'name',
            'Location' => 'location',
            'Location Details' => 'location',
            'Notes' => 'notes',
            'Comments' => 'notes',
            'Details' => 'notes',
        ];
        
        foreach ($header as $index => $field) {
            $cleanField = trim($field);
            
            // Skip empty headers
            if (empty($cleanField)) {
                continue;
            }
            
            \Log::info("Checking header field: '{$cleanField}' at index {$index}");
            
            foreach ($expectedFields as $expectedField => $mappedField) {
                if (strtolower($cleanField) === strtolower($expectedField)) {
                    if ($mappedField) { // Only map if it's not null (like Item Number)
                        $headerMap[$index] = $mappedField;
                        \Log::info("Mapped '{$cleanField}' to '{$mappedField}'");
                    }
                    break;
                }
            }
        }
        
        // Log the header mapping for debugging
        \Log::info('Final header mapping:', $headerMap);
        
        // Check if required fields are present
        $requiredFields = ['drive_ref', 'name'];
        $missingFields = [];
        
        foreach ($requiredFields as $field) {
            if (!in_array($field, $headerMap)) {
                // Find the expected field name for this mapped field
                $expectedFieldName = array_search($field, $expectedFields);
                $missingFields[] = $expectedFieldName;
            }
        }
        
        if (!empty($missingFields)) {
            fclose($handle);
            // Clean up temporary file
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
            
            // Create a more helpful error message
            $foundHeaders = array_filter($header, function($h) { return !empty(trim($h)); });
            $errorMessage = 'CSV file is missing required fields. ';
            $errorMessage .= 'Required: Drive Number (or Drive Ref), Drive Description (or Name). ';
            $errorMessage .= 'Found headers: ' . implode(', ', $foundHeaders) . '. ';
            $errorMessage .= 'Please ensure your CSV has columns named "Drive Number" and "Drive Description" (case insensitive).';
            
            \Log::error('Missing required fields', [
                'missing' => $missingFields, 
                'found_headers' => $foundHeaders,
                'header_mapping' => $headerMap
            ]);
            return $this->returnImportResponse($request, false, 0, [$errorMessage]);
        }
        
        // Process the file
        $imported = 0;
        $errors = [];
        $lineNumber = $headerRowIndex; // Start from the header row we found
        $totalLines = 0;
        
        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;
            $totalLines++;
            
            // Log each row for debugging (first 5 rows only)
            if ($totalLines <= 5) {
                \Log::info("Row {$lineNumber}:", $row);
            }
            
            // Skip empty rows
            if (empty(array_filter($row, function($value) { return trim($value) !== ''; }))) {
                continue;
            }
            
            // Map data
            $data = [];
            foreach ($headerMap as $index => $field) {
                if ($field && isset($row[$index])) {
                    $value = trim($row[$index]);
                    
                    // Sanitize the value to ensure proper UTF-8 and remove problematic characters
                    $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value); // Remove control characters
                    $value = preg_replace('/[^\x20-\x7E\x{00A0}-\x{FFFF}]/u', '', $value); // Keep only printable characters
                    
                    $data[$field] = $value;
                }
            }
            
            // Log mapped data for debugging (first 5 rows only)
            if ($totalLines <= 5) {
                \Log::info("Mapped data for line {$lineNumber}:", $data);
            }
            
            // Check if required fields are present and not empty
            if (empty($data['drive_ref']) || empty($data['name'])) {
                $driveRef = isset($data['drive_ref']) ? $data['drive_ref'] : 'empty';
                $driveName = isset($data['name']) ? $data['name'] : 'empty';
                $errors[] = "Line {$lineNumber}: Missing required field (Drive Number: '{$driveRef}' or Drive Description: '{$driveName}')";
                continue;
            }
            
            try {
                // Check if a drive with this reference already exists
                $existingDrive = Drive::where('drive_ref', $data['drive_ref'])->first();
                
                if ($existingDrive) {
                    // Update existing drive
                    $existingDrive->update($data);
                    \Log::info("Updated existing drive: {$data['drive_ref']}");
                } else {
                    // Create new drive
                    Drive::create($data);
                    \Log::info("Created new drive: {$data['drive_ref']}");
                }
                
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Line {$lineNumber}: " . $e->getMessage();
                \Log::error("Error processing line {$lineNumber}: " . $e->getMessage());
            }
        }
        
        fclose($handle);
        
        // Clean up temporary file
        if (isset($tempFile) && file_exists($tempFile)) {
            unlink($tempFile);
        }
        
        \Log::info("Import completed. Total lines processed: {$totalLines}, Imported: {$imported}, Errors: " . count($errors));
        
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
        
        // For Inertia requests, return to the drives page with flash data
        $drives = Drive::withCount('parts')
            ->when($request->input('search'), function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('drive_ref', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
        
        if (!$success) {
            return Inertia::render('drive', [
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
            
            return Inertia::render('drive', [
                'drives' => $drives,
                'flash' => [
                    'success' => "Imported {$imported} drives with some issues",
                    'error' => $errorSummary,
                    'import_result' => $result
                ]
            ]);
        }
        
        // For successful import
        return Inertia::render('drive', [
            'drives' => $drives,
            'flash' => [
                'success' => "Successfully imported {$imported} drives",
                'import_result' => $result
            ]
        ]);
    }
}
