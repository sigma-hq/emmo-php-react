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
import { Textarea } from '@/components/ui/textarea';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { PlusIcon, Pencil, Trash2, CheckCircle, ClipboardList, Search, X, ArrowRight, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
    id: number;
    name: string;
}

interface Inspection {
    id: number;
    name: string;
    description: string | null;
    status: 'draft' | 'active' | 'completed' | 'archived';
    created_by: number;
    created_at: string;
    updated_at: string;
    creator?: User;
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

interface InspectionsPageProps {
    inspections: {
        data: Inspection[];
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
        title: 'Inspections',
        href: '/inspections',
    },
];

export default function Inspections({ inspections, flash }: InspectionsPageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        id: '',
        name: '',
        description: '',
        status: 'draft',
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
                route('inspections'),
                { search: searchTerm },
                { preserveState: true, preserveScroll: true, only: ['inspections'] }
            );
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);
    
    const openCreateDialog = () => {
        reset();
        setIsEditMode(false);
        setIsOpen(true);
    };
    
    const openEditDialog = (inspection: Inspection) => {
        reset();
        setData({
            id: inspection.id.toString(),
            name: inspection.name,
            description: inspection.description || '',
            status: inspection.status,
        });
        setIsEditMode(true);
        setIsOpen(true);
    };
    
    const openDeleteDialog = (inspection: Inspection) => {
        setInspectionToDelete(inspection);
        setShowDeleteDialog(true);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditMode) {
            put(route('api.inspections.update', data.id), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        } else {
            post(route('api.inspections.store'), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        }
    };
    
    const handleDelete = () => {
        if (inspectionToDelete) {
            router.delete(route('api.inspections.destroy', inspectionToDelete.id));
            setShowDeleteDialog(false);
            setInspectionToDelete(null);
        }
    };
    
    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url);
        }
    };
    
    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-200 text-gray-800';
            case 'active':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'archived':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inspection Management" />
            
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
                
                {/* Page Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-6 w-6 text-[var(--emmo-green-primary)]" />
                            <h1 className="text-2xl font-bold tracking-tight">Inspection Management</h1>
                        </div>
                        <Button onClick={openCreateDialog} className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Inspection
                        </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                        Create and manage inspection procedures for drives and parts.
                    </p>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                        placeholder="Search inspections..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Inspections Table */}
                <div className="rounded-md border">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-[var(--emmo-light-bg)] text-left text-sm font-medium">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="hidden px-4 py-3 md:table-cell">Created By</th>
                                <th className="hidden px-4 py-3 md:table-cell">Date Created</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inspections.data.length > 0 ? (
                                inspections.data.map((inspection) => (
                                    <tr key={inspection.id} className="border-b hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">
                                            <div className="flex flex-col">
                                                <span>{inspection.name}</span>
                                                {inspection.description && (
                                                    <span className="text-sm text-gray-500 line-clamp-1">
                                                        {inspection.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClasses(inspection.status)}`}>
                                                {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            {inspection.creator?.name || 'Unknown'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                                            {new Date(inspection.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Link href={route('api.inspections.show', inspection.id)}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <span className="sr-only">View</span>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => openEditDialog(inspection)}
                                                >
                                                    <span className="sr-only">Edit</span>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-red-500"
                                                    onClick={() => openDeleteDialog(inspection)}
                                                >
                                                    <span className="sr-only">Delete</span>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-gray-500">
                                        No inspections found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {inspections.data.length > 0 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {inspections.from} to {inspections.to} of {inspections.total} results
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(inspections.prev_page_url)}
                                disabled={!inspections.prev_page_url}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {inspections.links
                                .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                                .map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => goToPage(link.url)}
                                        className={link.active ? "bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]" : ""}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(inspections.next_page_url)}
                                disabled={!inspections.next_page_url}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
                
                {/* Create/Edit Inspection Dialog */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? 'Edit Inspection' : 'Create New Inspection'}</DialogTitle>
                            <DialogDescription>
                                {isEditMode
                                    ? 'Update the inspection details below.'
                                    : 'Fill in the inspection details below to create a new inspection.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? "border-red-500" : ""}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description (Optional)
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="status" className={errors.status ? "text-red-500" : ""}>
                                        Status
                                    </Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => setData('status', value)}
                                    >
                                        <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-500">{errors.status}</p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                                >
                                    {isEditMode ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                
                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the inspection 
                                <span className="font-medium"> {inspectionToDelete?.name}</span>. 
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDelete}
                                className="bg-red-500 text-white hover:bg-red-600"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
} 