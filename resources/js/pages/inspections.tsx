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
import { 
    PlusIcon, 
    Pencil, 
    Trash2, 
    CheckCircle, 
    ClipboardList, 
    Search, 
    X, 
    ArrowRight, 
    ChevronLeft, 
    ChevronRight, 
    Eye, 
    Filter,
    ClipboardCheck,
    ClipboardX,
    Clock,
    Archive
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [activeView, setActiveView] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    
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
                { search: searchTerm, status: statusFilter !== 'all' ? statusFilter : undefined },
                { preserveState: true, preserveScroll: true, only: ['inspections'] }
            );
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter]);
    
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
    
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft':
                return <Clock className="h-4 w-4" />;
            case 'active':
                return <ClipboardList className="h-4 w-4" />;
            case 'completed':
                return <ClipboardCheck className="h-4 w-4" />;
            case 'archived':
                return <Archive className="h-4 w-4" />;
            default:
                return <ClipboardList className="h-4 w-4" />;
        }
    };
    
    // Count inspections by status
    const statusCounts = {
        draft: inspections.data.filter(i => i.status === 'draft').length,
        active: inspections.data.filter(i => i.status === 'active').length,
        completed: inspections.data.filter(i => i.status === 'completed').length,
        archived: inspections.data.filter(i => i.status === 'archived').length,
        all: inspections.data.length
    };
    
    // Filter inspections based on the active view
    const filteredInspections = inspections.data.filter(inspection => {
        if (statusFilter !== 'all') {
            return inspection.status === statusFilter;
        }
        return true;
    });
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inspection Management" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
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
                
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white hover:bg-gray-50 cursor-pointer border-l-4 border-l-gray-400" onClick={() => setStatusFilter('all')}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">All Inspections</p>
                                <p className="text-2xl font-bold mt-1">{statusCounts.all}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <ClipboardList className="h-5 w-5 text-gray-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-white hover:bg-gray-50 cursor-pointer border-l-4 border-l-gray-400" onClick={() => setStatusFilter('draft')}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Draft</p>
                                <p className="text-2xl font-bold mt-1">{statusCounts.draft}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-gray-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-white hover:bg-gray-50 cursor-pointer border-l-4 border-l-blue-400" onClick={() => setStatusFilter('active')}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active</p>
                                <p className="text-2xl font-bold mt-1">{statusCounts.active}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <ClipboardList className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-white hover:bg-gray-50 cursor-pointer border-l-4 border-l-green-400" onClick={() => setStatusFilter('completed')}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Completed</p>
                                <p className="text-2xl font-bold mt-1">{statusCounts.completed}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <ClipboardCheck className="h-5 w-5 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                            placeholder="Search inspections..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <span>Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {/* View Options */}
                <Tabs defaultValue="grid" className="w-full">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="grid">Grid View</TabsTrigger>
                            <TabsTrigger value="table">Table View</TabsTrigger>
                        </TabsList>
                        <div className="text-sm text-gray-500">
                            {filteredInspections.length} {filteredInspections.length === 1 ? 'inspection' : 'inspections'} found
                        </div>
                    </div>
                    
                    {/* Grid View */}
                    <TabsContent value="grid" className="mt-0">
                        {filteredInspections.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredInspections.map((inspection) => (
                                    <Card key={inspection.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <Badge className={getStatusBadgeClasses(inspection.status)} variant="outline">
                                                    <span className="flex items-center gap-1">
                                                        {getStatusIcon(inspection.status)}
                                                        {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                                                    </span>
                                                </Badge>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(inspection.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <CardTitle className="mt-2 text-lg">{inspection.name}</CardTitle>
                                            {inspection.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {inspection.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="pb-2 text-sm">
                                            <p className="text-gray-500">
                                                Created by {inspection.creator?.name || 'Unknown'}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="flex justify-between pt-2 border-t">
                                            <Link href={route('api.inspections.show', inspection.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => openEditDialog(inspection)}
                                                >
                                                    <Pencil className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="text-red-500 border-red-200 hover:bg-red-50"
                                                    onClick={() => openDeleteDialog(inspection)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No inspections found</h3>
                                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                                    {searchTerm ? 
                                        `No inspections match your search term "${searchTerm}"` : 
                                        "Get started by creating your first inspection using the 'New Inspection' button above."
                                    }
                                </p>
                                {searchTerm && (
                                    <Button 
                                        variant="outline" 
                                        className="mt-4"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* Table View */}
                    <TabsContent value="table" className="mt-0">
                        {filteredInspections.length > 0 ? (
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
                                        {filteredInspections.map((inspection) => (
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
                                                    <Badge className={getStatusBadgeClasses(inspection.status)}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(inspection.status)}
                                                            {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                                                        </span>
                                                    </Badge>
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No inspections found</h3>
                                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                                    {searchTerm ? 
                                        `No inspections match your search term "${searchTerm}"` : 
                                        "Get started by creating your first inspection using the 'New Inspection' button above."
                                    }
                                </p>
                                {searchTerm && (
                                    <Button 
                                        variant="outline" 
                                        className="mt-4"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
                
                {/* Pagination (conditional, only show when needed) */}
                {inspections.last_page > 1 && (
                    <div className="flex items-center justify-between mt-4">
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