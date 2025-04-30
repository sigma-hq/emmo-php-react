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
import { PlusIcon, Pencil, Trash2, CheckCircle, CpuIcon, Search, X, ArrowRight, ChevronLeft, ChevronRight, Link2Icon, UnlinkIcon, Check, ChevronsUpDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
}

interface Part {
    id: number;
    name: string;
    part_ref: string;
    status: 'attached' | 'unattached';
    drive_id: number | null;
    drive?: Drive | null;
    notes: string | null;
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

interface PartsPageProps {
    parts: {
        data: Part[];
    } & Pagination;
    drives: Drive[];
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
        title: 'Parts',
        href: '/parts',
    },
];

export default function Parts({ parts, drives, flash }: PartsPageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [partToDelete, setPartToDelete] = useState<Part | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [driveComboboxOpen, setDriveComboboxOpen] = useState(false);
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        id: '',
        name: '',
        part_ref: '',
        status: 'unattached',
        drive_id: '',
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
                route('parts'),
                { search: searchTerm },
                { preserveState: true, preserveScroll: true, only: ['parts'] }
            );
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);
    
    const openCreateDialog = () => {
        reset();
        setIsEditMode(false);
        setIsOpen(true);
    };
    
    const openEditDialog = (part: Part) => {
        reset();
        setData({
            id: part.id.toString(),
            name: part.name,
            part_ref: part.part_ref,
            status: part.status,
            drive_id: part.drive_id ? part.drive_id.toString() : '',
            notes: part.notes || '',
        });
        setIsEditMode(true);
        setIsOpen(true);
    };
    
    const openDeleteDialog = (part: Part) => {
        setPartToDelete(part);
        setShowDeleteDialog(true);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditMode) {
            put(route('api.parts.update', data.id), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        } else {
            post(route('api.parts.store'), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        }
    };
    
    const handleDelete = () => {
        if (partToDelete) {
            router.delete(route('api.parts.destroy', partToDelete.id));
            setShowDeleteDialog(false);
            setPartToDelete(null);
        }
    };
    
    const handleStatusChange = (status: 'attached' | 'unattached') => {
        setData('status', status);
        if (status === 'unattached') {
            setData('drive_id', '');
        }
    };
    
    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url);
        }
    };
    
    // Find the selected drive name for display in combobox
    const getSelectedDriveName = () => {
        if (!data.drive_id) return null;
        const selectedDrive = drives.find(drive => drive.id.toString() === data.drive_id);
        return selectedDrive ? `${selectedDrive.name} (${selectedDrive.drive_ref})` : null;
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Parts Management" />
            
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
                            <CpuIcon className="h-6 w-6 text-[var(--emmo-green-primary)]" />
                            <h1 className="text-2xl font-bold tracking-tight">Parts Management</h1>
                        </div>
                        
                        <Button 
                            onClick={openCreateDialog} 
                            className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] rounded-full px-4 transition-all duration-200 hover:shadow-md"
                        >
                            <PlusIcon className="mr-2 h-4 w-4" /> New Part
                        </Button>
                    </div>
                    
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                        Manage machinery parts and assign them to drives. Track part status and maintenance history.
                    </p>
                    
                    {/* Search Bar - Floating design */}
                    <div className="relative mt-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input 
                            type="text" 
                            placeholder="Search parts by name, reference or drive..." 
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
                
                {/* Parts Table - Modern minimalist design */}
                <div className="overflow-x-auto -mx-6">
                    {parts.data.length > 0 ? (
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Name</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Reference</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Drive</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Notes</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-right px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parts.data.map((part, index) => (
                                    <tr 
                                        key={part.id} 
                                        className={`relative group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-sm">
                                            <span className="font-medium text-gray-900 dark:text-white">{part.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                                                {part.part_ref}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {part.status === 'attached' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800">
                                                    <Link2Icon className="h-3 w-3" /> Attached
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                                                    <UnlinkIcon className="h-3 w-3" /> Unattached
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {part.drive ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[var(--emmo-green-primary)]">{part.drive.name}</span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-600">({part.drive.drive_ref})</span>
                                                </div>
                                            ) : (
                                                '—'
                                            )}
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
                                                <button 
                                                    onClick={() => openEditDialog(part)}
                                                    className="text-[var(--emmo-green-primary)] hover:text-[var(--emmo-green-dark)] transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteDialog(part)}
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
                                <CpuIcon className="h-10 w-10 text-[var(--emmo-green-primary)]" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                {searchTerm ? 'No matching parts found' : 'No parts yet'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                                {searchTerm 
                                    ? `We couldn't find any parts matching "${searchTerm}". Try a different search or clear the filter.` 
                                    : 'Get started by creating your first part to track and manage your machinery components.'}
                            </p>
                            
                            {!searchTerm && (
                                <Button 
                                    onClick={openCreateDialog} 
                                    className="inline-flex items-center bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] text-white font-medium rounded-full px-4 py-2"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    Add Your First Part
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
                {parts.data.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium">{parts.from}</span> to <span className="font-medium">{parts.to}</span> of{' '}
                            <span className="font-medium">{parts.total}</span> parts
                            {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={`${!parts.prev_page_url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                onClick={() => goToPage(parts.prev_page_url)}
                                disabled={!parts.prev_page_url}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous</span>
                            </Button>
                            
                            <div className="flex items-center gap-1">
                                {parts.links.filter(link => !link.label.includes('Previous') && !link.label.includes('Next')).map((link, i) => {
                                    // Skip ellipsis links if too many pages
                                    if (parts.last_page > 7) {
                                        if (
                                            parts.current_page > 4 && 
                                            i > 1 && 
                                            i < parts.links.length - 4 && 
                                            Math.abs(i - parts.current_page) > 1
                                        ) {
                                            return i === 2 ? (
                                                <div key={i} className="px-2 text-gray-400">...</div>
                                            ) : null;
                                        }
                                        
                                        if (
                                            parts.current_page <= parts.last_page - 4 && 
                                            i > parts.current_page + 1 && 
                                            i < parts.links.length - 2
                                        ) {
                                            return i === parts.current_page + 2 ? (
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
                                className={`${!parts.next_page_url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                onClick={() => goToPage(parts.next_page_url)}
                                disabled={!parts.next_page_url}
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
                                    {isEditMode ? 'Edit Part Details' : 'Add New Part'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 max-w-sm">
                                    {isEditMode 
                                        ? 'Update information about this machinery part.' 
                                        : 'Enter details for a new machinery part.'}
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
                                        <Label htmlFor="part_ref" className="text-sm font-medium block">
                                            Reference ID <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="part_ref"
                                            value={data.part_ref}
                                            onChange={(e) => setData('part_ref', e.target.value)}
                                            className="w-full"
                                            placeholder="Unique identifier (e.g., PART-001)"
                                            required
                                        />
                                        {errors.part_ref && (
                                            <p className="text-red-500 text-sm mt-1">{errors.part_ref}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            This must be unique across all parts in the system
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium block">
                                            Status <span className="text-red-500">*</span>
                                        </Label>
                                        <RadioGroup 
                                            value={data.status} 
                                            onValueChange={(value) => handleStatusChange(value as 'attached' | 'unattached')}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem id="status-attached" value="attached" />
                                                <Label htmlFor="status-attached" className="flex items-center gap-1.5">
                                                    <Link2Icon className="h-3.5 w-3.5 text-green-600" />
                                                    Attached
                                                </Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem id="status-unattached" value="unattached" />
                                                <Label htmlFor="status-unattached" className="flex items-center gap-1.5">
                                                    <UnlinkIcon className="h-3.5 w-3.5 text-gray-500" />
                                                    Unattached
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                        {errors.status && (
                                            <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                                        )}
                                    </div>
                                    
                                    {data.status === 'attached' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="drive_id" className="text-sm font-medium block">
                                                Drive <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setDriveComboboxOpen(true)}
                                                    className="w-full justify-between"
                                                >
                                                    {data.drive_id 
                                                        ? getSelectedDriveName() 
                                                        : "Select drive..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                                
                                                {driveComboboxOpen && (
                                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden">
                                                        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                            <Input
                                                                type="text"
                                                                placeholder="Search drives..."
                                                                className="w-full"
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-[220px] overflow-y-auto p-1">
                                                            {drives
                                                                .filter(drive => 
                                                                    drive.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                                    drive.drive_ref.toLowerCase().includes(searchTerm.toLowerCase())
                                                                )
                                                                .map(drive => (
                                                                    <button
                                                                        key={drive.id}
                                                                        type="button"
                                                                        className={cn(
                                                                            "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                                                                            data.drive_id === drive.id.toString() && "bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20"
                                                                        )}
                                                                        onClick={() => {
                                                                            setData('drive_id', drive.id.toString());
                                                                            setDriveComboboxOpen(false);
                                                                            setSearchTerm('');
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                data.drive_id === drive.id.toString() ? "opacity-100 text-[var(--emmo-green-primary)]" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <span className="font-medium">{drive.name}</span>
                                                                        <span className="ml-2 text-xs text-gray-500">({drive.drive_ref})</span>
                                                                    </button>
                                                                ))}
                                                            
                                                            {drives.filter(drive => 
                                                                drive.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                                drive.drive_ref.toLowerCase().includes(searchTerm.toLowerCase())
                                                            ).length === 0 && (
                                                                <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                                    No drives found
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Add an overlay to capture clicks outside the dropdown */}
                                            {driveComboboxOpen && (
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => {
                                                        setDriveComboboxOpen(false);
                                                        setSearchTerm('');
                                                    }}
                                                />
                                            )}
                                            
                                            {errors.drive_id && (
                                                <p className="text-red-500 text-sm mt-1">{errors.drive_id}</p>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-sm font-medium block">
                                            Notes
                                        </Label>
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]"
                                            placeholder="Additional details, specifications, etc."
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
                                            {isEditMode ? 'Save Changes' : 'Create Part'}
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
                                    <AlertDialogTitle className="text-xl font-bold">Delete Part</AlertDialogTitle>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <AlertDialogDescription className="text-base mb-4">
                                    Are you sure you want to delete this part?
                                </AlertDialogDescription>
                                
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4 mb-4">
                                    <div className="font-medium text-red-800 dark:text-red-300 mb-2">Part Information</div>
                                    <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                                        <dt className="text-gray-600 dark:text-gray-400">Name:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{partToDelete?.name}</dd>
                                        
                                        <dt className="text-gray-600 dark:text-gray-400">Reference:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{partToDelete?.part_ref}</dd>
                                        
                                        <dt className="text-gray-600 dark:text-gray-400">Status:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white capitalize">
                                            {partToDelete?.status === 'attached' ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Link2Icon className="h-3 w-3 text-green-600" /> Attached 
                                                    {partToDelete?.drive && ` to ${partToDelete.drive.name}`}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1">
                                                    <UnlinkIcon className="h-3 w-3 text-gray-500" /> Unattached
                                                </span>
                                            )}
                                        </dd>
                                    </dl>
                                </div>
                                
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    This action cannot be undone. The part will be permanently removed from the system.
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
            </div>
        </AppLayout>
    );
} 