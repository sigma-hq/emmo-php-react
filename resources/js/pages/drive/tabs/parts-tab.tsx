import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CpuIcon, Search, PlusIcon, Pencil, Trash2, Link2Icon, UnlinkIcon, CheckCircle2, X, Check, ChevronsUpDown } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Part {
    id: number;
    name: string;
    part_ref: string;
    status: 'attached' | 'unattached';
    drive_id: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    notes: string | null;
    parts: Part[];
    created_at: string;
    updated_at: string;
}

interface PartsTabProps {
    drive: Drive;
}

export default function PartsTab({ drive }: PartsTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
    const [isDetachDialogOpen, setIsDetachDialogOpen] = useState(false);
    const [partToDetach, setPartToDetach] = useState<Part | null>(null);
    const [processing, setProcessing] = useState(false);
    const [unattachedParts, setUnattachedParts] = useState<Part[]>([]);
    const [selectedPartId, setSelectedPartId] = useState<string>('');
    const [attachmentNotes, setAttachmentNotes] = useState('');
    const [isPartComboOpen, setIsPartComboOpen] = useState(false);
    const [comboSearchTerm, setComboSearchTerm] = useState('');
    const [isLoadingParts, setIsLoadingParts] = useState(false);
    
    // Filter parts based on search term
    const filteredParts = drive.parts.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_ref.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Fetch unattached parts when the attach dialog opens
    useEffect(() => {
        if (isAttachDialogOpen) {
            fetchUnattachedParts();
        }
    }, [isAttachDialogOpen]);
    
    // Function to fetch unattached parts
    const fetchUnattachedParts = async () => {
        try {
            setIsLoadingParts(true);
            const response = await fetch('/api/unattached-parts');
            const data = await response.json();
            setUnattachedParts(data);
        } catch (error) {
            console.error('Failed to fetch unattached parts:', error);
        } finally {
            setIsLoadingParts(false);
        }
    };
    
    // Function to handle part detachment
    const openDetachDialog = (part: Part) => {
        setPartToDetach(part);
        setIsDetachDialogOpen(true);
    };
    
    // Function to confirm part detachment
    const confirmDetachPart = () => {
        if (!partToDetach) return;
        
        setProcessing(true);
        
        // Use the regular form submission to avoid Inertia error
        fetch(route('api.parts.update-attachment', partToDetach.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                status: 'unattached',
                drive_id: null,
                attachment_notes: 'Detached from drive via drive details page',
            })
        })
        .then(response => response.json())
        .then(data => {
            setProcessing(false);
            setIsDetachDialogOpen(false);
            
            // Show success message
            setSuccessMessage(`Part ${partToDetach.name} successfully detached`);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
            
            // Refresh the drive data
            router.visit(window.location.href, { preserveScroll: true });
        })
        .catch(error => {
            console.error('Detachment error:', error);
            setProcessing(false);
        });
    };
    
    // Function to handle part attachment
    const handleAttachPart = () => {
        if (!selectedPartId) return;
        
        setProcessing(true);
        
        // Use the regular form submission to avoid Inertia error
        fetch(route('api.parts.update-attachment', selectedPartId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                status: 'attached',
                drive_id: drive.id,
                attachment_notes: attachmentNotes || 'Attached via drive details page',
            })
        })
        .then(response => response.json())
        .then(data => {
            setProcessing(false);
            setIsAttachDialogOpen(false);
            setSelectedPartId('');
            setAttachmentNotes('');
            
            // Show success message
            setSuccessMessage('Part successfully attached to drive');
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
            
            // Refresh the drive data
            router.visit(window.location.href, { preserveScroll: true });
        })
        .catch(error => {
            console.error('Attachment error:', error);
            setProcessing(false);
        });
    };
    
    // Function to get selected part name for display
    const getSelectedPartName = () => {
        if (!selectedPartId) return null;
        const selectedPart = unattachedParts.find(part => part.id.toString() === selectedPartId);
        return selectedPart ? `${selectedPart.name} (${selectedPart.part_ref})` : null;
    };
    
    return (
        <div className="space-y-6">
            {/* Success Message */}
            {showSuccessMessage && (
                <div className="bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow flex items-center gap-2 absolute top-6 right-6 z-50 animate-in fade-in slide-in-from-top-5">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{successMessage}</span>
                    <button 
                        onClick={() => setShowSuccessMessage(false)}
                        className="ml-2 text-white/80 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            
            {/* Header with search and actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search parts..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => setSearchTerm('')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        className="h-9 gap-1"
                        asChild
                    >
                        <Link href={route('parts')}>
                            <CpuIcon className="h-4 w-4" />
                            <span>All Parts</span>
                        </Link>
                    </Button>
                    
                    <Button 
                        className="h-9 gap-1"
                        variant="outline"
                        onClick={() => setIsAttachDialogOpen(true)}
                    >
                        <Link2Icon className="h-4 w-4" />
                        <span>Attach Existing Part</span>
                    </Button>
                    
                    <Button 
                        className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] h-9 gap-1"
                        asChild
                    >
                        <Link href={route('parts', { preselect_drive: drive.id })}>
                            <PlusIcon className="h-4 w-4" />
                            <span>Create New Part</span>
                        </Link>
                    </Button>
                </div>
            </div>
            
            {/* Parts List */}
            {filteredParts.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr>
                                <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Name</th>
                                <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Reference</th>
                                <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                                <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Notes</th>
                                <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-right px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParts.map((part, index) => (
                                <tr 
                                    key={part.id} 
                                    className={`relative group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}
                                >
                                    <td className="px-6 py-4 text-sm">
                                        <Link 
                                            href={route('api.parts.show', part.id)}
                                            className="font-medium text-gray-900 dark:text-white hover:text-[var(--emmo-green-primary)] hover:underline"
                                        >
                                            {part.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                                            {part.part_ref}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800">
                                            <Link2Icon className="h-3 w-3" /> Attached
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {part.notes ? (
                                            <div className="group relative">
                                                <p className="truncate max-w-[250px]">{part.notes}</p>
                                                {part.notes.length > 30 && (
                                                    <div className="hidden group-hover:block absolute left-0 top-full mt-1 p-3 bg-white dark:bg-gray-800 shadow-lg rounded z-10 max-w-sm">
                                                        {part.notes}
                                                    </div>
                                                )}
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="invisible group-hover:visible flex justify-end gap-3 items-center">
                                            <Link
                                                href={route('api.parts.show', part.id)}
                                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                            >
                                                <CpuIcon className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                href={route('api.parts.edit', part.id)}
                                                className="text-[var(--emmo-green-primary)] hover:text-[var(--emmo-green-dark)] transition-colors"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button 
                                                onClick={() => openDetachDialog(part)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Detach from this drive"
                                            >
                                                <UnlinkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900/50 mb-4">
                        <CpuIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {searchTerm ? 'No matching parts found' : 'No parts attached'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                        {searchTerm
                            ? `No parts matching "${searchTerm}" are attached to this drive.`
                            : `This drive currently doesn't have any parts attached to it.`}
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button 
                            className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                            asChild
                        >
                            <Link href={route('parts', { preselect_drive: drive.id })}>
                                <PlusIcon className="h-4 w-4 mr-2" /> 
                                Create New Part
                            </Link>
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            onClick={() => setIsAttachDialogOpen(true)} 
                            className="border-[var(--emmo-green-light)] text-[var(--emmo-green-primary)]"
                        >
                            <Link2Icon className="h-4 w-4 mr-2" /> 
                            Attach Existing Part
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Attach Part Dialog */}
            <Dialog open={isAttachDialogOpen} onOpenChange={setIsAttachDialogOpen}>
                <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
                    <div className="flex flex-col h-full">
                        {/* Header with visual treatment */}
                        <div className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                            <DialogTitle className="text-2xl font-bold mb-2">
                                Attach Part to Drive
                            </DialogTitle>
                            <DialogDescription className="text-white/80 max-w-sm">
                                Select an existing part to attach to {drive.name} ({drive.drive_ref})
                            </DialogDescription>
                        </div>
                        
                        {/* Form fields */}
                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="part_id" className="text-sm font-medium block">
                                        Select Part <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsPartComboOpen(true)}
                                            className="w-full justify-between"
                                        >
                                            {selectedPartId
                                                ? getSelectedPartName()
                                                : "Select a part to attach..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>

                                        {isPartComboOpen && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden">
                                                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                    <Input
                                                        type="text"
                                                        placeholder="Search parts..."
                                                        className="w-full"
                                                        value={comboSearchTerm}
                                                        onChange={(e) => setComboSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[220px] overflow-y-auto p-1">
                                                    {isLoadingParts ? (
                                                        <div className="px-2 py-6 text-center">
                                                            <svg className="animate-spin h-5 w-5 text-[var(--emmo-green-primary)] mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <p className="text-gray-500 text-sm">Loading available parts...</p>
                                                        </div>
                                                    ) : unattachedParts.length === 0 ? (
                                                        <div className="px-2 py-6 text-center">
                                                            <p className="text-gray-500 text-sm">No unattached parts available</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {unattachedParts
                                                                .filter(part =>
                                                                    part.name.toLowerCase().includes(comboSearchTerm.toLowerCase()) ||
                                                                    part.part_ref.toLowerCase().includes(comboSearchTerm.toLowerCase())
                                                                )
                                                                .map(part => (
                                                                    <button
                                                                        key={part.id}
                                                                        type="button"
                                                                        className={cn(
                                                                            "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                                                                            selectedPartId === part.id.toString() && "bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20"
                                                                        )}
                                                                        onClick={() => {
                                                                            setSelectedPartId(part.id.toString());
                                                                            setIsPartComboOpen(false);
                                                                            setComboSearchTerm('');
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                selectedPartId === part.id.toString() ? "opacity-100 text-[var(--emmo-green-primary)]" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <span className="font-medium">{part.name}</span>
                                                                        <span className="ml-2 text-xs text-gray-500">({part.part_ref})</span>
                                                                    </button>
                                                                ))}
                                                            
                                                            {unattachedParts.filter(part =>
                                                                part.name.toLowerCase().includes(comboSearchTerm.toLowerCase()) ||
                                                                part.part_ref.toLowerCase().includes(comboSearchTerm.toLowerCase())
                                                            ).length === 0 && (
                                                                <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                                    No unattached parts found
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Overlay to close dropdown */}
                                        {isPartComboOpen && (
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => {
                                                    setIsPartComboOpen(false);
                                                    setComboSearchTerm('');
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <Label htmlFor="attachment_notes" className="text-sm font-medium block">
                                        Notes about this attachment
                                    </Label>
                                    <textarea
                                        id="attachment_notes"
                                        value={attachmentNotes}
                                        onChange={(e) => setAttachmentNotes(e.target.value)}
                                        className="w-full min-h-[80px] p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]"
                                        placeholder="Reason for attaching this part (will be recorded in history)"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer with actions */}
                        <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => {
                                    setIsAttachDialogOpen(false);
                                    setSelectedPartId('');
                                    setAttachmentNotes('');
                                }}
                                className="border-gray-200 dark:border-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="button" 
                                onClick={handleAttachPart}
                                disabled={processing || !selectedPartId} 
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] transition-colors px-5"
                            >
                                {processing ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        Attach Part
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Detach Part Confirmation Dialog */}
            <Dialog open={isDetachDialogOpen} onOpenChange={setIsDetachDialogOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-xl p-0 overflow-hidden">
                    <div className="flex flex-col h-full">
                        {/* Visual header */}
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
                            <DialogTitle className="text-xl font-bold mb-2">
                                Detach Part
                            </DialogTitle>
                            <DialogDescription className="text-white/80">
                                Are you sure you want to detach this part from the drive?
                            </DialogDescription>
                        </div>
                        
                        <div className="p-6">
                            {partToDetach && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-lg p-4 mb-4">
                                    <div className="font-medium text-amber-800 dark:text-amber-300 mb-2">Part Information</div>
                                    <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                                        <dt className="text-gray-600 dark:text-gray-400">Name:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{partToDetach.name}</dd>
                                        
                                        <dt className="text-gray-600 dark:text-gray-400">Reference:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{partToDetach.part_ref}</dd>
                                    </dl>
                                </div>
                            )}
                            
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                This will disconnect the part from this drive. The part will still exist in the system and can be attached to another drive later.
                            </p>
                        </div>
                        
                        <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => {
                                    setIsDetachDialogOpen(false);
                                    setPartToDetach(null);
                                }}
                                className="border-gray-200 dark:border-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="button" 
                                onClick={confirmDetachPart}
                                disabled={processing} 
                                className="bg-amber-600 hover:bg-amber-700 transition-colors"
                            >
                                {processing ? "Processing..." : "Detach Part"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 