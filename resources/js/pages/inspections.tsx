import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
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
    Clock,
    Archive,
    BarChart3,
    RefreshCcw,
    Copy,
    Calendar,
    ChevronsUpDown,
    Check,
    User,
    AlertTriangle,
    Circle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
    id: number;
    name: string;
}

interface Inspection {
    id: number;
    name: string;
    description: string | null;
    status: 'draft' | 'active' | 'completed' | 'archived' | 'failed';
    created_by: number;
    created_at: string;
    updated_at: string;
    creator?: User;
    operator?: User;
    completedBy?: User;
    is_template: boolean;
    parent_inspection_id?: number | null;
    schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    schedule_interval?: number | null;
    schedule_start_date?: string | Date | null;
    schedule_end_date?: string | Date | null;
    schedule_next_due_date?: string | null;
    schedule_last_created_at?: string | null;
    tasks_count?: number;
    completed_tasks_count?: number;
    priority_info?: {
        level: string;
        label: string;
        color: string;
        icon: string;
        urgency: string;
        days_until_due: number;
        is_overdue: boolean;
        due_date: string;
        formatted_due_date: string;
        time_remaining: string;
    };
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
    users: User[];
    statistics: {
        total: number;
        templates: number;
        instances: number;
        active: number;
        draft: number;
        completed: number;
        failed: number;
        archived: number;
    };
    filters: {
        search: string;
        type: string;
        status: string;
        per_page: number;
    };
    flash?: {
        success?: string;
    };
    isAdmin?: boolean;
}

interface InspectionFormData {
    [key: string]: any; // Add index signature
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'completed' | 'archived' | 'failed';
    operator_id: string | null;
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

// Add a helper function to calculate progress percentage
const calculateProgress = (inspection: Inspection): number => {
    if (!inspection.tasks_count || inspection.tasks_count === 0) return 0;
    if (inspection.status === 'completed') return 100; // Always 100% for completed inspections
    
    const completedTasks = inspection.completed_tasks_count || 0;
    return Math.round((completedTasks / inspection.tasks_count) * 100);
};

export default function Inspections({ inspections, users, statistics, filters, flash, isAdmin }: InspectionsPageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [perPage, setPerPage] = useState(filters.per_page);
    const [isOperatorComboOpen, setIsOperatorComboOpen] = useState(false);
    const [operatorSearchTerm, setOperatorSearchTerm] = useState('');
    
    // Apply client-side filtering for priority
    const filteredInspections = useMemo(() => {
        if (priorityFilter === 'all') {
            return inspections.data;
        }
        
        return inspections.data.filter(inspection => {
            if (!inspection.priority_info) return false;
            
            switch (priorityFilter) {
                case 'urgent':
                    return inspection.priority_info.level === 'high' || inspection.priority_info.level === 'overdue';
                case 'overdue':
                    return inspection.priority_info.level === 'overdue';
                case 'high':
                    return inspection.priority_info.level === 'high';
                case 'medium':
                    return inspection.priority_info.level === 'medium';
                case 'low':
                    return inspection.priority_info.level === 'low';
                default:
                    return true;
            }
        });
    }, [inspections.data, priorityFilter]);
    
    const { data, setData, post, put, processing, errors, reset } = useForm<InspectionFormData>({
        id: '',
        name: '',
        description: '',
        status: 'draft',
        operator_id: null,
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
                { 
                    search: searchTerm, 
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    per_page: perPage
                },
                { preserveState: true, preserveScroll: true }
            );
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, typeFilter, perPage]);
    
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
            operator_id: inspection.operator?.id?.toString() || null,
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
    
    const handlePerPageChange = (value: string) => {
        setPerPage(parseInt(value));
    };
    
    const goToPage = (url: string | null) => {
        if (url) {
            // Extract page number from URL
            const urlParams = new URLSearchParams(url.split('?')[1] || '');
            const page = urlParams.get('page') || '1';
            
            // Navigate with current filters and the new page
            router.get(
                route('inspections'),
                { 
                    search: searchTerm, 
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    per_page: perPage,
                    page: page
                },
                { preserveState: true, preserveScroll: true }
            );
        }
    };
    
    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
            case 'active':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800';
            case 'failed':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800';
            case 'archived':
                return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
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
            case 'failed':
                return <X className="h-4 w-4" />;
            case 'archived':
                return <Archive className="h-4 w-4" />;
            default:
                return <ClipboardList className="h-4 w-4" />;
        }
    };
    
    // Use statistics from backend instead of calculating from paginated data
    const statusCounts = {
        draft: statistics.draft,
        active: statistics.active,
        completed: statistics.completed,
        failed: statistics.failed,
        archived: statistics.archived,
        templates: statistics.templates,
        instances: statistics.instances,
        all: statistics.total
    };
    
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
                        {isAdmin && (
                            <Button onClick={openCreateDialog} className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                New Inspection
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Create and manage inspection procedures for drives and parts.
                    </p>
                </div>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className={`shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${typeFilter === 'all' ? 'ring-2 ring-[var(--emmo-green-primary)]' : ''}`} onClick={() => setTypeFilter('all')}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Inspections</CardTitle>
                                <div className="rounded-full p-1.5 bg-gray-100">
                                    <BarChart3 className="h-4 w-4 text-gray-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-4">
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.all}</div>
                                <div className="text-xs text-gray-500">100%</div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-400 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className={`shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${typeFilter === 'templates' ? 'ring-2 ring-[var(--emmo-green-primary)]' : ''}`} onClick={() => setTypeFilter('templates')}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">Templates</CardTitle>
                                <div className="rounded-full p-1.5 bg-purple-100">
                                    <RefreshCcw className="h-4 w-4 text-purple-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-4">
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.templates}</div>
                                <div className="text-xs text-gray-500">
                                    {statusCounts.all > 0 ? Math.round((statusCounts.templates / statusCounts.all) * 100) : 0}%
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${statusCounts.all > 0 ? (statusCounts.templates / statusCounts.all) * 100 : 0}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className={`shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${typeFilter === 'instances' ? 'ring-2 ring-[var(--emmo-green-primary)]' : ''}`} onClick={() => setTypeFilter('instances')}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">Instances</CardTitle>
                                <div className="rounded-full p-1.5 bg-blue-100">
                                    <Copy className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-4">
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.instances}</div>
                                <div className="text-xs text-gray-500">
                                    {statusCounts.all > 0 ? Math.round((statusCounts.instances / statusCounts.all) * 100) : 0}%
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${statusCounts.all > 0 ? (statusCounts.instances / statusCounts.all) * 100 : 0}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className={`shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${statusFilter === 'active' ? 'ring-2 ring-[var(--emmo-green-primary)]' : ''}`} onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                                <div className="rounded-full p-1.5 bg-green-100">
                                    <ClipboardList className="h-4 w-4 text-green-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-4">
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{statusCounts.active}</div>
                                <div className="text-xs text-gray-500">
                                    {statusCounts.all > 0 ? Math.round((statusCounts.active / statusCounts.all) * 100) : 0}%
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full" style={{ width: `${statusCounts.all > 0 ? ((statusCounts.active / statusCounts.all) * 100) : 0}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Priority Filter Cards */}
                    <Card className={`shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${priorityFilter === 'urgent' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent')}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
                                <div className="rounded-full p-1.5 bg-red-100">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-4">
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold text-red-600">
                                    {inspections.data.filter(insp => insp.priority_info?.level === 'high' || insp.priority_info?.level === 'overdue').length}
                                </div>
                                <div className="text-xs text-gray-500">Priority</div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className={`shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${priorityFilter === 'overdue' ? 'ring-2 ring-red-600' : ''}`} onClick={() => setPriorityFilter(priorityFilter === 'overdue' ? 'all' : 'overdue')}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
                                <div className="rounded-full p-1.5 bg-red-100">
                                    <Clock className="h-4 w-4 text-red-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-4">
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold text-red-600">
                                    {inspections.data.filter(insp => insp.priority_info?.level === 'overdue').length}
                                </div>
                                <div className="text-xs text-gray-500">Critical</div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 mt-2 mb-1 rounded-full overflow-hidden">
                                <div className="h-full bg-red-600 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2 -mt-2">
                    <Button 
                        variant={statusFilter === 'all' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setStatusFilter('all')}
                        className={statusFilter === 'all' ? "bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]" : ""}
                    >
                        All Statuses <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{statusCounts.all}</span>
                    </Button>
                    <Button 
                        variant={statusFilter === 'draft' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
                        className={statusFilter === 'draft' ? "bg-gray-700 hover:bg-gray-800" : ""}
                    >
                        <Clock className="h-3 w-3 mr-1" />
                        Draft <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{statusCounts.draft}</span>
                    </Button>
                    <Button 
                        variant={statusFilter === 'active' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
                        className={statusFilter === 'active' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Active <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{statusCounts.active}</span>
                    </Button>
                    <Button 
                        variant={statusFilter === 'completed' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
                        className={statusFilter === 'completed' ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        <ClipboardCheck className="h-3 w-3 mr-1" />
                        Completed <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{statusCounts.completed}</span>
                    </Button>
                    <Button 
                        variant={statusFilter === 'archived' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setStatusFilter(statusFilter === 'archived' ? 'all' : 'archived')}
                        className={statusFilter === 'archived' ? "bg-amber-600 hover:bg-amber-700" : ""}
                    >
                        <Archive className="h-3 w-3 mr-1" />
                        Archived <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{statusCounts.archived}</span>
                    </Button>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                            placeholder="Search inspections..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[140px] md:w-[180px]">
                    <div className="flex items-center gap-2">
                                    <Copy className="h-4 w-4 text-gray-500" />
                                    <span className="truncate">{typeFilter === 'all' ? 'All Types' : typeFilter === 'templates' ? 'Templates' : 'Instances'}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="templates">Templates Only</SelectItem>
                                <SelectItem value="instances">Instances Only</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
                            <SelectTrigger className="w-[110px]">
                                <div className="flex items-center gap-1">
                                    <BarChart3 className="h-3.5 w-3.5 text-gray-500" />
                                    <span>{perPage} per page</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="25">25 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                                <SelectItem value="100">100 per page</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {/* Active Filters */}
                {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                    <div className="flex flex-wrap items-center gap-2 py-2">
                        <span className="text-sm text-gray-500">Active filters:</span>
                        {searchTerm && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Search className="h-3 w-3" />
                                "{searchTerm}"
                                <button onClick={() => setSearchTerm('')} className="ml-1 rounded-full hover:bg-gray-200 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {statusFilter !== 'all' && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Filter className="h-3 w-3" />
                                Status: {statusFilter}
                                <button onClick={() => setStatusFilter('all')} className="ml-1 rounded-full hover:bg-gray-200 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {typeFilter !== 'all' && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Copy className="h-3 w-3" />
                                Type: {typeFilter}
                                <button onClick={() => setTypeFilter('all')} className="ml-1 rounded-full hover:bg-gray-200 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setTypeFilter('all');
                            }}
                            className="text-xs h-7"
                        >
                            Clear all
                        </Button>
                    </div>
                )}
                
                {/* Result Count */}
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">
                        {filteredInspections.length} of {inspections.total} {inspections.total === 1 ? 'inspection' : 'inspections'} found
                        {priorityFilter !== 'all' && ` (filtered by ${priorityFilter} priority)`}
                    </div>
                </div>
                
                {/* Inspections List */}
                {filteredInspections.length > 0 ? (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-6"></th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inspection</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Description</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Tasks</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48 hidden md:table-cell">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32 hidden lg:table-cell">Priority</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Created</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Creator</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Operator</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Completed By</th>
                                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredInspections.map((inspection) => (
                                        <tr key={inspection.id} className={cn(
                                            "hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-b border-gray-100 dark:border-gray-800",
                                            inspection.priority_info?.level === 'overdue' && "bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500",
                                            inspection.priority_info?.level === 'high' && "bg-orange-50 dark:bg-orange-900/10 border-l-4 border-l-orange-500",
                                            inspection.priority_info?.level === 'medium' && "bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500"
                                        )}>
                                            {/* Type indicator Icon */}
                                            <td className="px-4 py-4 text-center">
                                                {inspection.is_template ? (
                                                    <span title="Template" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                                        <RefreshCcw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </span>
                                                ) : (
                                                    <span title="Instance" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                                        <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Inspection name */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <Link 
                                                        href={route('inspections.show', inspection.id)}
                                                        className="text-base font-medium text-gray-900 dark:text-gray-100 hover:text-[var(--emmo-green-primary)] transition-colors"
                                                    >
                                                        {inspection.name}
                                                    </Link>
                                                    
                                                    {/* Show parent link for instances */}
                                                    {!inspection.is_template && inspection.parent_inspection_id && (
                                                        <Link 
                                                            href={route('inspections.show', inspection.parent_inspection_id)} 
                                                            className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                                                        >
                                                            <ArrowRight className="h-3 w-3 mr-1" />
                                                            From Template #{inspection.parent_inspection_id}
                                                        </Link>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 md:hidden">
                                                        <span>ID: #{inspection.id}</span>
                                                        <span>•</span>
                                                        <span>{new Date(inspection.created_at).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}</span>
                                                        {inspection.operator && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-blue-600 dark:text-blue-400">Operator: {inspection.operator.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Description */}
                                            <td className="px-6 py-4">
                                                {inspection.description ? (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 max-w-xs">{inspection.description}</p>
                                                ) : (
                                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No description</p>
                                                )}
                                            </td>
                                            
                                            {/* Tasks Count */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)] text-[var(--emmo-green-primary)] dark:text-[var(--emmo-green-light)] font-medium text-sm">
                                                    {inspection.tasks_count || 0}
                                                </span>
                                            </td>
                                            
                                            {/* Status / Schedule Column */}
                                            <td className="px-6 py-4">
                                                {inspection.is_template ? (
                                                    // Display Schedule Info for Templates
                                                    <div className="text-sm">
                                                        <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 h-6 px-2.5">
                                                            <span className="flex items-center gap-1">
                                                            <RefreshCcw className="h-3.5 w-3.5" />
                                                            <span>Template</span>
                                                            </span>
                                                        </Badge>
                                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                                             {formatFrequency(inspection.schedule_frequency, inspection.schedule_interval)}
                                                        </div>
                                                        {inspection.schedule_next_due_date && (
                                                             <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                                                Next: {format(new Date(inspection.schedule_next_due_date), "MMM d, yyyy")}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Display Status & Progress for Instances
                                                    <div>
                                                        <Badge className={`${getStatusBadgeClasses(inspection.status)} dark:bg-opacity-20 h-6 px-2.5`}>
                                                            <span className="flex items-center gap-1">
                                                                {getStatusIcon(inspection.status)}
                                                                <span>{inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}</span>
                                                            </span>
                                                        </Badge>
                                                        <div className="w-full mt-2">
                                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                                                                <div 
                                                                    className={`h-1 rounded-full ${
                                                                        inspection.status === 'completed' ? 'bg-green-500 dark:bg-green-400' :
                                                                        inspection.status === 'active' ? 'bg-blue-500 dark:bg-blue-400' :
                                                                        inspection.status === 'archived' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-gray-400 dark:bg-gray-500'
                                                                    }`}
                                                                    style={{ width: `${calculateProgress(inspection)}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                                                                <span>{inspection.completed_tasks_count || 0} of {inspection.tasks_count || 0} tasks</span>
                                                                <span>{calculateProgress(inspection)}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            
                                            {/* Priority */}
                                            <td className="px-6 py-4 text-sm hidden lg:table-cell">
                                                {inspection.priority_info ? (
                                                    <div className="flex flex-col items-start">
                                                        <Badge 
                                                            className={`${
                                                                inspection.priority_info.level === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                inspection.priority_info.level === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                inspection.priority_info.level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                inspection.priority_info.level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                            } h-6 px-2.5 text-xs font-medium`}
                                                        >
                                                            <span className="flex items-center gap-1">
                                                                {inspection.priority_info.level === 'overdue' ? (
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                ) : inspection.priority_info.level === 'high' ? (
                                                                    <Clock className="h-3 w-3" />
                                                                ) : inspection.priority_info.level === 'medium' ? (
                                                                    <Clock className="h-3 w-3" />
                                                                ) : inspection.priority_info.level === 'low' ? (
                                                                    <Clock className="h-3 w-3" />
                                                                ) : (
                                                                    <Circle className="h-3 w-3" />
                                                                )}
                                                                <span>{inspection.priority_info.label}</span>
                                                            </span>
                                                        </Badge>
                                                        {inspection.priority_info.due_date && (
                                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                {inspection.priority_info.time_remaining}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 italic">No due date</span>
                                                )}
                                            </td>
                                            
                                            {/* Created date */}
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">
                                                <div className="flex flex-col">
                                                    <span>{new Date(inspection.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}</span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {new Date(inspection.created_at).toLocaleTimeString(undefined, {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Creator */}
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-2">
                                                        {(inspection.creator?.name || 'U').charAt(0)}
                                                    </div>
                                                    <span>{inspection.creator?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Operator */}
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                                {inspection.operator ? (
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-2">
                                                            {inspection.operator.name.charAt(0)}
                                                        </div>
                                                        <span>{inspection.operator.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 italic">Not assigned</span>
                                                )}
                                            </td>
                                            
                                            {/* Completed By */}
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                                                {inspection.completedBy ? (
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mr-2">
                                                            {inspection.completedBy.name.charAt(0)}
                                                        </div>
                                                        <span className="font-medium">{inspection.completedBy.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mr-2">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-gray-400 dark:text-gray-500 italic">
                                                            {inspection.status === 'completed' ? 'Unknown' : 'Not completed'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            
                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <Link 
                                                        href={route('inspections.show', inspection.id)}
                                                        className="text-gray-600 dark:text-gray-400 hover:text-[var(--emmo-green-primary)] transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    {isAdmin && (
                                                        <>
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
                                                                className="h-8 w-8 p-0 text-red-500 dark:text-red-400"
                                                                onClick={() => openDeleteDialog(inspection)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                        <ClipboardList className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No inspections found</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' ? 
                                `No inspections match your current filters` : 
                                "Get started by creating your first inspection using the 'New Inspection' button above."
                            }
                        </p>
                        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
                            <Button 
                                variant="outline" 
                                className="mt-4"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setTypeFilter('all');
                                    setPriorityFilter('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
                
                {/* Pagination (update for better responsiveness) */}
                {inspections.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                        <p className="text-sm text-gray-500">
                            Showing {inspections.from} to {inspections.to} of {inspections.total} results
                        </p>
                        <div className="flex items-center justify-center sm:justify-end gap-1">
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
                                .slice(0, window.innerWidth < 640 ? 5 : inspections.links.length) // Show fewer links on mobile
                                .map((link, i) => {
                                    // Handle pagination labels with HTML entities
                                    const label = link.label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
                                    return (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => goToPage(link.url)}
                                        className={link.active ? "bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]" : ""}
                                    >
                                            {label}
                                    </Button>
                                    );
                                })}
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
                    <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            {/* Header with visual treatment */}
                            <div className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-2">
                                    {isEditMode ? 'Edit Inspection' : 'Add New Inspection'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 max-w-sm">
                                    {isEditMode 
                                        ? 'Update information about this inspection.' 
                                        : 'Enter details for a new inspection.'}
                                </DialogDescription>
                            </div>
                            <div className="grid gap-4 p-6 overflow-y-auto">
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
                                    >
                                        <SelectTrigger className={`${errors.status ? 'border-red-500' : ''}`.trim()}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-500">{errors.status}</p>
                                    )}
                                </div>
                                
                                {/* Operator Selection */}
                                <div className="grid gap-2">
                                    <Label htmlFor="operator_id">
                                        Operator (Optional)
                                    </Label>
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsOperatorComboOpen(true)}
                                            className="w-full justify-between"
                                        >
                                            {data.operator_id
                                                ? users.find(u => u.id.toString() === data.operator_id)?.name || "Select an operator"
                                                : "Select an operator"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                        {isOperatorComboOpen && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden">
                                                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                    <Input
                                                        type="text"
                                                        placeholder="Search operators..."
                                                        className="w-full"
                                                        value={operatorSearchTerm}
                                                        onChange={(e) => setOperatorSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[220px] overflow-y-auto p-1">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                                                            data.operator_id === null && "bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20"
                                                        )}
                                                        onClick={() => {
                                                            setData('operator_id', null);
                                                            setIsOperatorComboOpen(false);
                                                            setOperatorSearchTerm('');
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                data.operator_id === null ? "opacity-100 text-[var(--emmo-green-primary)]" : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="font-medium">No operator assigned</span>
                                                    </button>
                                                    
                                                    {users
                                                        .filter(user => user.name.toLowerCase().includes(operatorSearchTerm.toLowerCase()))
                                                        .map(user => (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                className={cn(
                                                                    "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                                                                    data.operator_id === user.id.toString() && "bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20"
                                                                )}
                                                                onClick={() => {
                                                                    setData('operator_id', user.id.toString());
                                                                    setIsOperatorComboOpen(false);
                                                                    setOperatorSearchTerm('');
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        data.operator_id === user.id.toString() ? "opacity-100 text-[var(--emmo-green-primary)]" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="font-medium">{user.name}</span>
                                                            </button>
                                                        ))}
                                                    {users.filter(user => user.name.toLowerCase().includes(operatorSearchTerm.toLowerCase())).length === 0 && (
                                                        <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                            No operators found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/* Overlay to close dropdown */}
                                        {isOperatorComboOpen && (
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => {
                                                    setIsOperatorComboOpen(false);
                                                    setOperatorSearchTerm('');
                                                }}
                                            />
                                        )}
                                    </div>
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
                            <DialogFooter className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
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