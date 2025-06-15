import React, { useState, useCallback, useRef } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadIcon, XIcon, AlertCircleIcon, CheckCircleIcon, AlertTriangleIcon, FileTextIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { router } from '@inertiajs/react';

interface PageProps {
    flash?: {
        success?: string;
        error?: string;
        import_result?: ImportResult;
    };
}

interface CSVImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: (result: ImportResult) => void;
    importUrl: string;
    title?: string;
    description?: string;
    acceptedFileTypes?: string;
    maxFileSize?: number; // in MB
    templateUrl?: string;
}

interface ImportResult {
    success: boolean;
    imported: number;
    errors: string[];
}

export function CSVImportDialog({
    isOpen,
    onClose,
    onImportComplete,
    importUrl,
    title = 'Import CSV Data',
    description = 'Upload a CSV file to import data. The file should have headers matching the required fields.',
    acceptedFileTypes = '.csv',
    maxFileSize = 10, // 10MB default
    templateUrl
}: CSVImportDialogProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);
    
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    
    const validateFile = useCallback((file: File): string | null => {
        // Check file type
        const fileType = file.name.split('.').pop()?.toLowerCase();
        if (fileType !== 'csv') {
            return 'Only CSV files are accepted';
        }
        
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
            return `File size exceeds ${maxFileSize}MB limit`;
        }
        
        return null;
    }, [maxFileSize]);
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;
        
        const validationError = validateFile(droppedFile);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setFile(droppedFile);
        setError(null);
    }, [validateFile]);
    
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setFile(selectedFile);
        setError(null);
    }, [validateFile]);
    
    const handleImport = useCallback(async () => {
        if (!file) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                // Increase progress up to 95% (the last 5% will happen when the request completes)
                if (prev >= 95) {
                    clearInterval(progressInterval);
                    return 95;
                }
                return prev + 5;
            });
        }, 300);
        
        try {
            // Use Inertia.js router for the upload
            const formData = new FormData();
            formData.append('file', file);
            
            // Log the file being uploaded for debugging
            console.log('Uploading file:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
            
            router.post(importUrl, formData, {
                forceFormData: true,
                onSuccess: (page) => {
                    clearInterval(progressInterval);
                    setUploadProgress(100);
                    
                    // Log what we got back for debugging
                    console.log('Import response:', page.props);
                    
                    // For Inertia responses, check for flash messages
                    const flash = (page.props as PageProps).flash;
                    const flashSuccess = flash?.success;
                    const flashError = flash?.error;
                    const importResult = flash?.import_result;
                    
                    console.log('Flash messages:', { flashSuccess, flashError, importResult });
                    
                    if (importResult) {
                        // Use the actual import result from the backend
                        setImportResult(importResult);
                        onImportComplete(importResult);
                    } else if (flashSuccess) {
                        // If there's no import_result but we have a success message, create a default result
                        const defaultResult = {
                            success: true,
                            imported: parseInt(flashSuccess.match(/\d+/)?.[0] || '0'),
                            errors: flashError ? [flashError] : []
                        };
                        
                        setImportResult(defaultResult);
                        onImportComplete(defaultResult);
                    } else if (flashError && !flashSuccess) {
                        // Only throw error if there's an error but no success message
                        throw new Error(flashError);
                    } else {
                        // If no flash messages, something went wrong
                        throw new Error('No import result received from server');
                    }
                },
                onError: (errors) => {
                    clearInterval(progressInterval);
                    console.log('Import errors:', errors);
                    
                    // Handle validation errors
                    if (errors.file) {
                        setError(Array.isArray(errors.file) ? errors.file[0] : errors.file);
                    } else {
                        setError(errors.message || Object.values(errors).join(', ') || 'An error occurred during import');
                    }
                },
                onFinish: () => {
                    setIsUploading(false);
                }
            });
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Import error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setIsUploading(false);
        }
    }, [file, importUrl, onImportComplete]);
    
    const resetImport = useCallback(() => {
        setFile(null);
        setError(null);
        setImportResult(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);
    
    const handleClose = useCallback(() => {
        resetImport();
        onClose();
    }, [resetImport, onClose]);
    
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    {/* File Drop Area */}
                    {!importResult && !isUploading && (
                        <div
                            className={`
                                border-2 border-dashed rounded-lg p-8
                                ${isDragging 
                                    ? 'border-[var(--emmo-green-primary)] bg-[var(--emmo-green-light)]/10' 
                                    : 'border-gray-300 dark:border-gray-700'}
                                ${error ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : ''}
                                transition-colors duration-200 ease-in-out
                                flex flex-col items-center justify-center
                                min-h-[200px] text-center
                            `}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept={acceptedFileTypes}
                                className="hidden"
                                onChange={handleFileSelect}
                                ref={fileInputRef}
                            />
                            
                            {file ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20 rounded-full flex items-center justify-center">
                                        <FileTextIcon className="h-8 w-8 text-[var(--emmo-green-primary)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{file.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={resetImport}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <XIcon className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <UploadIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Drop your CSV file here</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        or <span className="text-[var(--emmo-green-primary)] cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>browse</span> to upload
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Accepted file: {acceptedFileTypes}, max {maxFileSize}MB
                                    </p>
                                    {templateUrl && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                            <a 
                                                href={templateUrl} 
                                                className="text-[var(--emmo-green-primary)] hover:underline"
                                                download
                                            >
                                                Download template
                                            </a>
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    
                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircleIcon className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 dark:text-white">Importing...</h3>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="w-full" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center">
                                Please don't close this dialog while the import is in progress
                            </p>
                        </div>
                    )}
                    
                    {/* Import Results */}
                    {importResult && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {importResult.success ? (
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                        <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                                        <AlertTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        {importResult.success 
                                            ? `Import Complete - ${importResult.imported} Records Processed` 
                                            : 'Import Completed with Issues'}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {importResult.success 
                                            ? 'Your data has been successfully imported' 
                                            : 'There were some issues with the import'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Errors if any */}
                            {importResult.errors.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Issues ({importResult.errors.length})</h4>
                                    <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-md">
                                        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                                            {importResult.errors.map((error, index) => (
                                                <li key={index} className="px-4 py-2 text-sm">
                                                    <span className="text-red-500 dark:text-red-400">{error}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <DialogFooter className="flex-row-reverse justify-start gap-2">
                    {!importResult && !isUploading && (
                        <>
                            <Button 
                                onClick={handleImport} 
                                disabled={!file || isUploading || !!error}
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                            >
                                Import Data
                            </Button>
                            {templateUrl && (
                                <Button variant="outline" asChild>
                                    <a href={templateUrl} download>Download Template</a>
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                        </>
                    )}
                    
                    {(importResult || isUploading) && (
                        <Button 
                            onClick={handleClose} 
                            disabled={isUploading}
                            variant={importResult ? "default" : "outline"}
                            className={importResult ? "bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]" : ""}
                        >
                            {importResult ? 'Close' : 'Cancel'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 