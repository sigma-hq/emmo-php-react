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
    Archive,
    BarChart3,
    ArrowUp,
    ArrowDown,
    RefreshCcw,
    Copy,
    Calendar
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

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
    is_template: boolean;
    parent_inspection_id?: number | null;
    schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    schedule_interval?: number | null;
    schedule_start_date?: string | Date | null;
    schedule_end_date?: string | Date | null;
    schedule_next_due_date?: string | null;
    schedule_last_created_at?: string | null;
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

interface InspectionFormData {
    [key: string]: any; // Add index signature
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    is_template: boolean;
    schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    schedule_interval: string;
    schedule_start_date: string | null;
    schedule_end_date: string | null;
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

// Helper function to format schedule frequency
const formatFrequency = (freq: string | null | undefined, interval: number | null | undefined): string => {
    if (!freq || !interval) return 'Non-repeating';
    const intervalText = interval > 1 ? `Every ${interval}` : 'Every';
    switch (freq) {
        case 'daily': return `${intervalText} ${interval > 1 ? 'days' : 'day'}`;
        case 'weekly': return `${intervalText} ${interval > 1 ? 'weeks' : 'week'}`;
        case 'monthly': return `${intervalText} ${interval > 1 ? 'months' : 'month'}`;
        case 'yearly': return `${intervalText} ${interval > 1 ? 'years' : 'year'}`;
        default: return 'Invalid Schedule';
    }
};

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
    
    const { data, setData, post, put, processing, errors, reset } = useForm<InspectionFormData>({
        id: '',
        name: '',
        description: '',
        status: 'draft',
        is_template: false,
        schedule_frequency: 'weekly',
        schedule_interval: '1',
        schedule_start_date: null,
        schedule_end_date: null,
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
            is_template: inspection.is_template,
            schedule_frequency: inspection.schedule_frequency || 'weekly',
            schedule_interval: inspection.schedule_interval ? inspection.schedule_interval.toString() : '1',
            schedule_start_date: inspection.schedule_start_date 
                ? format(new Date(inspection.schedule_start_date), 'yyyy-MM-dd') 
                : null,
            schedule_end_date: inspection.schedule_end_date 
                ? format(new Date(inspection.schedule_end_date), 'yyyy-MM-dd') 
                : null,
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
        
        const payload = {
            ...data,
            schedule_interval: data.is_template ? parseInt(data.schedule_interval, 10) || 1 : null,
            schedule_frequency: data.is_template ? data.schedule_frequency : null,
            schedule_start_date: data.is_template ? data.schedule_start_date : null,
            schedule_end_date: data.is_template ? data.schedule_end_date : null,
        };

        console.log("Submitting inspection data:", payload);

        if (isEditMode && data.id) {
            router.put(route('api.inspections.update', data.id), payload, {
                preserveScroll: true,
                onSuccess: () => { setIsOpen(false); },
                onError: (err) => { console.error("Update Error:", err); }
            });
        } else if (!isEditMode) {
            router.post(route('api.inspections.store'), payload, {
                preserveScroll: true,
                onSuccess: () => { setIsOpen(false); },
                onError: (err) => { console.error("Create Error:", err); }
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
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-gray-200" onClick={() => setStatusFilter('all')}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Inspections</CardTitle>
                                <div className="rounded-md p-1 bg-gray-50">
                                    <BarChart3 className="h-4 w-4 text-gray-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.all}</div>
                                <div className="text-xs text-gray-500">100%</div>
                            </div>
                            <div className="h-1 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-300 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200" onClick={() => setStatusFilter('draft')}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Draft</CardTitle>
                                <div className="rounded-md p-1 bg-gray-50">
                                    <Clock className="h-4 w-4 text-gray-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.draft}</div>
                                <div className="text-xs text-gray-500">
                                    {statusCounts.all > 0 ? Math.round((statusCounts.draft / statusCounts.all) * 100) : 0}%
                                </div>
                            </div>
                            <div className="h-1 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-300 rounded-full" style={{ width: `${statusCounts.all > 0 ? (statusCounts.draft / statusCounts.all) * 100 : 0}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200" onClick={() => setStatusFilter('active')}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Active</CardTitle>
                                <div className="rounded-md p-1 bg-gray-50">
                                    <ClipboardList className="h-4 w-4 text-gray-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.active}</div>
                                <div className="text-xs text-gray-500">
                                    {statusCounts.all > 0 ? Math.round((statusCounts.active / statusCounts.all) * 100) : 0}%
                                </div>
                            </div>
                            <div className="h-1 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-300 rounded-full" style={{ width: `${statusCounts.all > 0 ? (statusCounts.active / statusCounts.all) * 100 : 0}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200" onClick={() => setStatusFilter('completed')}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
                                <div className="rounded-md p-1 bg-gray-50">
                                    <ClipboardCheck className="h-4 w-4 text-gray-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.completed}</div>
                                <div className="text-xs text-gray-500">
                                    {statusCounts.all > 0 ? Math.round((statusCounts.completed / statusCounts.all) * 100) : 0}%
                                </div>
                            </div>
                            <div className="h-1 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-300 rounded-full" style={{ width: `${statusCounts.all > 0 ? (statusCounts.completed / statusCounts.all) * 100 : 0}%` }}></div>
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
                            <SelectTrigger className={`${errors.status ? 'border-red-500' : ''} ${data.is_template ? 'disabled:opacity-50' : ''}`.trim()}>
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
                
                {/* Result Count */}
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">
                        {filteredInspections.length} {filteredInspections.length === 1 ? 'inspection' : 'inspections'} found
                    </div>
                </div>
                
                {/* Inspections List */}
                {filteredInspections.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-6"></th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Creator</th>
                                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredInspections.map((inspection) => (
                                        <tr key={inspection.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            {/* Type indicator Icon */}
                                            <td className="px-4 py-4 text-center">
                                                {inspection.is_template ? (
                                                    <span title="Template" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100">
                                                        <RefreshCcw className="h-4 w-4 text-purple-600" />
                                                    </span>
                                                ) : (
                                                    <span title="Instance" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                                                        <Copy className="h-4 w-4 text-gray-500" />
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Inspection name */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <Link 
                                                        href={route('inspections.show', inspection.id)}
                                                        className="text-base font-medium text-gray-900 hover:text-[var(--emmo-green-primary)] transition-colors"
                                                    >
                                                        {inspection.name}
                                                    </Link>
                                                    
                                                    {/* Show parent link for instances */}
                                                    {!inspection.is_template && inspection.parent_inspection_id && (
                                                        <Link 
                                                            href={route('inspections.show', inspection.parent_inspection_id)} 
                                                            className="mt-1 text-xs text-blue-600 hover:underline inline-flex items-center"
                                                        >
                                                            <ArrowRight className="h-3 w-3 mr-1" />
                                                            From Template #{inspection.parent_inspection_id}
                                                        </Link>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 md:hidden">
                                                        <span>ID: #{inspection.id}</span>
                                                        <span>•</span>
                                                        <span>{new Date(inspection.created_at).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Description */}
                                            <td className="px-6 py-4">
                                                {inspection.description ? (
                                                    <p className="text-sm text-gray-500 line-clamp-2 max-w-xs">{inspection.description}</p>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">No description</p>
                                                )}
                                            </td>
                                            
                                            {/* Tasks Count - New Column */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[var(--emmo-green-light)] text-[var(--emmo-green-primary)] font-medium text-sm">
                                                    {/* Since we don't have tasks count in the data, we'll display a placeholder.
                                                        In a real implementation, you'd fetch and display the actual task count */}
                                                    0
                                                </span>
                                            </td>
                                            
                                            {/* Status / Schedule Column */}
                                            <td className="px-6 py-4">
                                                {inspection.is_template ? (
                                                    // Display Schedule Info for Templates
                                                    <div className="text-sm">
                                                        <Badge className="bg-purple-100 text-purple-800 h-6 px-2.5">
                                                            <span className="flex items-center gap-1">
                                                            <RefreshCcw className="h-3.5 w-3.5" />
                                                            <span>Template</span>
                                                            </span>
                                                        </Badge>
                                                        <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-gray-400" />
                                                             {formatFrequency(inspection.schedule_frequency, inspection.schedule_interval)}
                                                        </div>
                                                        {inspection.schedule_next_due_date && (
                                                             <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                                Next: {format(new Date(inspection.schedule_next_due_date), "MMM d, yyyy")}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Display Status & Progress for Instances
                                                    <div>
                                                        <Badge className={`${getStatusBadgeClasses(inspection.status)} h-6 px-2.5`}>
                                                            <span className="flex items-center gap-1">
                                                                {getStatusIcon(inspection.status)}
                                                                <span>{inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}</span>
                                                            </span>
                                                        </Badge>
                                                        <div className="w-full mt-2">
                                                            <div className="w-full bg-gray-100 rounded-full h-1">
                                                                <div 
                                                                    className={`h-1 rounded-full ${
                                                                        inspection.status === 'completed' ? 'bg-green-500' :
                                                                        inspection.status === 'active' ? 'bg-blue-500' :
                                                                        inspection.status === 'archived' ? 'bg-amber-500' : 'bg-gray-400'
                                                                    }`}
                                                                    style={{ width: inspection.status === 'completed' ? '100%' : 
                                                                             inspection.status === 'active' ? '50%' : 
                                                                             inspection.status === 'archived' ? '100%' : '25%' }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            
                                            {/* Created date */}
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap hidden lg:table-cell">
                                                <div className="flex flex-col">
                                                    <span>{new Date(inspection.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(inspection.created_at).toLocaleTimeString(undefined, {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Creator */}
                                            <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                                                <div className="flex items-center">
                                                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-2">
                                                        {(inspection.creator?.name || 'U').charAt(0)}
                                                    </div>
                                                    <span>{inspection.creator?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <Link 
                                                        href={route('inspections.show', inspection.id)}
                                                        className="text-gray-600 hover:text-[var(--emmo-green-primary)] transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => openEditDialog(inspection)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-500"
                                                        onClick={() => openDeleteDialog(inspection)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                    <DialogContent className="sm:max-w-[600px]">
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
                                        onValueChange={(value) => setData('status', value as any)}
                                        disabled={data.is_template}
                                    >
                                        <SelectTrigger className={`${errors.status ? 'border-red-500' : ''} ${data.is_template ? 'disabled:opacity-50' : ''}`.trim()}>
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
                                
                                <div className="items-center flex space-x-2 border-t pt-4 mt-2">
                                     <Checkbox 
                                        id="is_template" 
                                        checked={data.is_template}
                                        onCheckedChange={(checked) => setData('is_template', checked === true)}
                                    />
                                    <label
                                        htmlFor="is_template"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Make this a recurring inspection template
                                    </label>
                                </div>

                                {data.is_template && (
                                    <div className="grid gap-4 border p-4 rounded-md mt-2 bg-gray-50/50">
                                        <h4 className="text-sm font-medium text-gray-600 mb-0">Scheduling Options</h4>
                                        <div className="grid sm:grid-cols-[1fr_100px] gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="schedule_frequency">Frequency</Label>
                                                <Select
                                                    value={data.schedule_frequency}
                                                    onValueChange={(value) => setData('schedule_frequency', value as any)}
                                                >
                                                    <SelectTrigger className={errors.schedule_frequency ? "border-red-500" : ""}>
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="daily">Daily</SelectItem>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                        <SelectItem value="yearly">Yearly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.schedule_frequency && (
                                                    <p className="text-sm text-red-500">{errors.schedule_frequency}</p>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="schedule_interval">Every</Label>
                                                <Input
                                                    id="schedule_interval"
                                                    type="number"
                                                    min="1"
                                                    value={data.schedule_interval}
                                                    onChange={(e) => setData('schedule_interval', e.target.value)}
                                                    className={errors.schedule_interval ? "border-red-500" : ""}
                                                />
                                            </div>
                                        </div>
                                        {errors.schedule_interval && (
                                            <p className="text-sm text-red-500 -mt-2">{errors.schedule_interval}</p>
                                        )}

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="schedule_start_date">Start Date</Label>
                                                <Input 
                                                    type="date"
                                                    id="schedule_start_date"
                                                    value={data.schedule_start_date || ''}
                                                    onChange={(e) => setData('schedule_start_date', e.target.value || null)}
                                                    className={errors.schedule_start_date ? "border-red-500" : ""}
                                                />
                                                {errors.schedule_start_date && (
                                                    <p className="text-sm text-red-500">{errors.schedule_start_date}</p>
                                                )}
                                            </div>
                                             <div className="grid gap-2">
                                                <Label htmlFor="schedule_end_date">End Date (Optional)</Label>
                                                <Input 
                                                    type="date"
                                                    id="schedule_end_date"
                                                    value={data.schedule_end_date || ''}
                                                    onChange={(e) => setData('schedule_end_date', e.target.value || null)}
                                                    min={data.schedule_start_date || undefined}
                                                    className={errors.schedule_end_date ? "border-red-500" : ""}
                                                />
                                                {errors.schedule_end_date && (
                                                    <p className="text-sm text-red-500">{errors.schedule_end_date}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
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