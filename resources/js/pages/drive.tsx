import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage, Link } from '@inertiajs/react';
import { PlusIcon, Pencil, Trash2, CheckCircle, HardDrive, Info, Search, X, ArrowRight, ChevronLeft, ChevronRight, Eye, UploadIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CSVImportDialog } from '@/components/ui/csv-import-dialog';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    notes: string | null;
    parts_count: number;
    created_at: string;
    updated_at: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface Pagination {
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLinks[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

interface DrivePageProps {
    drives: {
        data: Drive[];
    } & Pagination;
    flash?: {
        success?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Drive',
        href: '/drive',
    },
];

export default function Drive({ drives, flash }: DrivePageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [driveToDelete, setDriveToDelete] = useState<Drive | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportDialog, setShowImportDialog] = useState(false);
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        id: '',
        name: '',
        drive_ref: '',
        location: '',
        notes: '',
    });
    
    // Handle flash messages from the backend
    useEffect(() => {
        if (flash && flash.success) {
            setSuccessMessage(flash.success);
            setShowSuccessNotification(true);
            
            // Auto-hide the notification after 3 seconds
            const timer = setTimeout(() => {
                setShowSuccessNotification(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [flash]);
    
    // Handle search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                route('drive'),
                { search: searchTerm },
                { preserveState: true, preserveScroll: true, only: ['drives'] }
            );
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);
    
    const openCreateDialog = () => {
        reset();
        setIsEditMode(false);
        setIsOpen(true);
    };
    
    const openEditDialog = (drive: Drive) => {
        reset();
        setData({
            id: drive.id.toString(),
            name: drive.name,
            drive_ref: drive.drive_ref,
            location: drive.location || '',
            notes: drive.notes || '',
        });
        setIsEditMode(true);
        setIsOpen(true);
    };
    
    const openDeleteDialog = (drive: Drive) => {
        setDriveToDelete(drive);
        setShowDeleteDialog(true);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditMode) {
            put(route('api.drives.update', data.id), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        } else {
            post(route('api.drives.store'), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        }
    };
    
    const handleDelete = () => {
        if (driveToDelete) {
            router.delete(route('api.drives.destroy', driveToDelete.id));
            setShowDeleteDialog(false);
            setDriveToDelete(null);
        }
    };
    
    const handleImportComplete = (result: any) => {
        if (result.success) {
            setSuccessMessage(`Successfully imported ${result.imported} drives`);
            setShowSuccessNotification(true);
            
            // Refresh the drives list
            router.reload({ only: ['drives'] });
        } else if (result.errors && result.errors.length > 0) {
            // Show the first error as notification
            setSuccessMessage(`Import completed with errors: ${result.errors[0]}`);
            setShowSuccessNotification(true);
        }
    };
    
    const goToPage = (url: string | null) => {
        if (url) {
            // Parse the URL to extract the page parameter
            const urlObj = new URL(url, window.location.origin);
            const page = urlObj.searchParams.get('page');
            
            // Navigate with current search term preserved
            router.get(route('drive'), {
                search: searchTerm,
                page: page
            }, {
                preserveState: true,
                preserveScroll: true,
                only: ['drives']
            });
        }
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Drive Management" />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Success Notification */}
                {showSuccessNotification && (
                    <div className="fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out">
                        <div className="flex items-center gap-3 bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow-lg">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">{successMessage}</p>
                            <button 
                                onClick={() => setShowSuccessNotification(false)}
                                className="ml-2 text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Page Header - Minimalist */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HardDrive className="h-6 w-6 text-[var(--emmo-green-primary)]" />
                            <h1 className="text-2xl font-bold tracking-tight">Drive Management</h1>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                variant="outline"
                                onClick={() => setShowImportDialog(true)}
                                className="flex items-center gap-2 border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                <UploadIcon className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                Import CSV
                            </Button>
                        
                            <Button 
                                onClick={openCreateDialog} 
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] rounded-full px-4 transition-all duration-200 hover:shadow-md"
                            >
                                <PlusIcon className="mr-2 h-4 w-4" /> New Drive
                            </Button>
                        </div>
                    </div>
                    
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                        Drives represent the physical drive components in your machinery. Track and manage all drives here.
                    </p>
                    
                    {/* Search Bar - Floating design */}
                    <div className="relative mt-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input 
                            type="text" 
                            placeholder="Search drives by name, reference or location..." 
                            className="pl-10 max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                </div>
                
                {/* Drives Table - Modern minimalist design */}
                <div className="overflow-x-auto -mx-6">
                    {drives.data.length > 0 ? (
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Name</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Reference</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Location</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Parts</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Notes</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-right px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drives.data.map((drive, index) => (
                                    <tr 
                                        key={drive.id} 
                                        className={`relative group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-sm">
                                            <span className="font-medium text-gray-900 dark:text-white">{drive.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                                {drive.drive_ref}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {drive.location || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {drive.parts_count > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--emmo-green-light)] text-[var(--emmo-green-dark)] dark:bg-[var(--emmo-green-dark)]/20 dark:text-[var(--emmo-green-light)] border border-[var(--emmo-green-primary)]/30">
                                                    {drive.parts_count} {drive.parts_count === 1 ? 'part' : 'parts'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-600">No parts</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {drive.notes ? (
                                                <div className="group relative">
                                                    <p className="truncate max-w-[250px]">{drive.notes}</p>
                                                    {drive.notes.length > 30 && (
                                                        <div className="hidden group-hover:block absolute left-0 top-full mt-1 p-3 bg-white dark:bg-gray-800 shadow-lg rounded z-10 max-w-sm">
                                                            {drive.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="invisible group-hover:visible flex justify-end gap-3 items-center">
                                                <Link
                                                    href={route('api.drives.show', drive.id)}
                                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => openEditDialog(drive)}
                                                    className="text-[var(--emmo-green-primary)] hover:text-[var(--emmo-green-dark)] transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteDialog(drive)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-full p-4 mb-4">
                                <HardDrive className="h-10 w-10 text-[var(--emmo-green-primary)]" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                {searchTerm ? 'No matching drives found' : 'No drives yet'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                                {searchTerm 
                                    ? `We couldn't find any drives matching "${searchTerm}". Try a different search or clear the filter.` 
                                    : 'Get started by creating your first drive to track and manage your equipment.'}
                            </p>
                            
                            {!searchTerm && (
                                <Button 
                                    onClick={openCreateDialog} 
                                    className="inline-flex items-center bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] text-white font-medium rounded-full px-4 py-2"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Add Your First Drive
                                </Button>
                            )}
                            
                            {searchTerm && (
                                <Button 
                                    onClick={() => setSearchTerm('')} 
                                    variant="outline" 
                                    className="inline-flex items-center font-medium rounded-full px-4 py-2"
                                >
                                    <X className="h-4 w-4 mr-1.5" />
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                {drives.data.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium">{drives.from}</span> to <span className="font-medium">{drives.to}</span> of{' '}
                            <span className="font-medium">{drives.total}</span> drives
                            {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={`${!drives.prev_page_url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                onClick={() => goToPage(drives.prev_page_url)}
                                disabled={!drives.prev_page_url}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous</span>
                            </Button>
                            
                            <div className="flex items-center gap-1">
                                {drives.links.filter(link => !link.label.includes('Previous') && !link.label.includes('Next')).map((link, i) => {
                                    // Skip ellipsis links if too many pages
                                    if (drives.last_page > 7) {
                                        if (
                                            drives.current_page > 4 && 
                                            i > 1 && 
                                            i < drives.links.length - 4 && 
                                            Math.abs(i - drives.current_page) > 1
                                        ) {
                                            return i === 2 ? (
                                                <div key={i} className="px-2 text-gray-400">...</div>
                                            ) : null;
                                        }
                                        
                                        if (
                                            drives.current_page <= drives.last_page - 4 && 
                                            i > drives.current_page + 1 && 
                                            i < drives.links.length - 2
                                        ) {
                                            return i === drives.current_page + 2 ? (
                                                <div key={i} className="px-2 text-gray-400">...</div>
                                            ) : null;
                                        }
                                    }
                                    
                                    return (
                                        <Button
                                            key={i}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            className={`min-w-[32px] ${link.active ? 'bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                            onClick={() => goToPage(link.url)}
                                        >
                                            {link.label}
                                        </Button>
                                    );
                                })}
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                className={`${!drives.next_page_url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                onClick={() => goToPage(drives.next_page_url)}
                                disabled={!drives.next_page_url}
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next</span>
                            </Button>
                        </div>
                    </div>
                )}
                
                {/* Create/Edit Dialog - Redesigned */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            {/* Header with visual treatment */}
                            <div className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-2">
                                    {isEditMode ? 'Edit Drive Details' : 'Add New Drive'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 max-w-sm">
                                    {isEditMode 
                                        ? 'Update information about this machinery drive component.' 
                                        : 'Enter details for a new machinery drive component.'}
                                </DialogDescription>
                            </div>
                            
                            {/* Form Fields - Clean layout */}
                            <div className="p-6 overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium block">
                                            Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full"
                                            placeholder="Enter a descriptive name"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="drive_ref" className="text-sm font-medium block">
                                            Reference ID <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="drive_ref"
                                            value={data.drive_ref}
                                            onChange={(e) => setData('drive_ref', e.target.value)}
                                            className="w-full"
                                            placeholder="Unique identifier (e.g., DRV-001)"
                                            required
                                        />
                                        {errors.drive_ref && (
                                            <p className="text-red-500 text-sm mt-1">{errors.drive_ref}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            This must be unique across all drives in the system
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="location" className="text-sm font-medium block">
                                            Location
                                        </Label>
                                        <Input
                                            id="location"
                                            value={data.location}
                                            onChange={(e) => setData('location', e.target.value)}
                                            className="w-full"
                                            placeholder="Physical location of the drive"
                                        />
                                        {errors.location && (
                                            <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-sm font-medium block">
                                            Notes
                                        </Label>
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]"
                                            placeholder="Additional details, maintenance history, etc."
                                        />
                                        {errors.notes && (
                                            <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer with gradient border top */}
                            <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                    className="border-gray-200 dark:border-gray-800"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing} 
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
                                            {isEditMode ? 'Save Changes' : 'Create Drive'}
                                            <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
                
                {/* Delete Confirmation Dialog - Creative redesign */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent className="max-w-[450px] rounded-xl p-0 overflow-hidden">
                        <div className="flex flex-col h-full">
                            {/* Visual header */}
                            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-full p-2">
                                        <Trash2 className="h-5 w-5 text-white" />
                                    </div>
                                    <AlertDialogTitle className="text-xl font-bold">Delete Drive</AlertDialogTitle>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <AlertDialogDescription className="text-base mb-4">
                                    Are you sure you want to delete this drive?
                                </AlertDialogDescription>
                                
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4 mb-4">
                                    <div className="font-medium text-red-800 dark:text-red-300 mb-2">Drive Information</div>
                                    <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                                        <dt className="text-gray-600 dark:text-gray-400">Name:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{driveToDelete?.name}</dd>
                                        
                                        <dt className="text-gray-600 dark:text-gray-400">Reference:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{driveToDelete?.drive_ref}</dd>
                                        
                                        {driveToDelete?.location && (
                                            <>
                                                <dt className="text-gray-600 dark:text-gray-400">Location:</dt>
                                                <dd className="font-medium text-gray-900 dark:text-white">{driveToDelete.location}</dd>
                                            </>
                                        )}
                                    </dl>
                                </div>
                                
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    This action cannot be undone. The drive will be permanently removed from the system.
                                </p>
                            </div>
                            
                            <AlertDialogFooter className="flex-row-reverse justify-start gap-3 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-950">
                                <AlertDialogAction 
                                    onClick={handleDelete} 
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium"
                                >
                                    Permanently Delete
                                </AlertDialogAction>
                                <AlertDialogCancel className="border-gray-200 dark:border-gray-800">
                                    Cancel
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
                
                {/* CSV Import Dialog */}
                <CSVImportDialog 
                    isOpen={showImportDialog}
                    onClose={() => setShowImportDialog(false)}
                    onImportComplete={handleImportComplete}
                    importUrl={route('api.drives.import')}
                    title="Import Drives from CSV"
                    description="Upload a CSV file with drive data. Required columns: 'Drive Number' (unique ID) and 'Drive Description' (name). Optional: 'Area' (location), 'Item' (notes). Column names are case-insensitive."
                />
            </div>
        </AppLayout>
    );
} 