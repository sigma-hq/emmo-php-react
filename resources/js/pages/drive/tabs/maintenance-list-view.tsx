import React, { useState, useMemo, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, Wrench, Calendar, User, Clock, CheckCircle2, ArrowUpDown, Filter, Search, ChevronDown, MoreVertical, Edit3, Trash2, ChevronRight, Clipboard } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import MaintenanceChecklist from '@/components/ui/maintenance-checklist';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Part {
    id: number;
    name: string;
    part_ref: string;
}

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';

interface Maintenance {
    id: number;
    drive_id: number;
    title: string;
    description: string | null;
    maintenance_date: string;
    technician: string | null;
    status: MaintenanceStatus;
    cost: number | null;
    parts_replaced: Part[] | null;
    user_id: number | null;
    user?: {
        id: number;
        name: string;
    };
    checklist_json?: string;
    created_at: string;
    updated_at: string;
}

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
}

interface MaintenanceListViewProps {
    drive: Drive;
    maintenances: Maintenance[];
    statusConfig: { 
        key: MaintenanceStatus; 
        label: string; 
        icon: React.ElementType, 
        colorClass: string,
        bgClass: string,
        iconColorClass: string 
    }[];
    onOpenAddDialog: () => void;
    onStatusUpdate: (maintenanceId: number, newStatus: MaintenanceStatus) => Promise<void>;
    onEditMaintenance: (maintenance: Maintenance) => void;
    onDeleteMaintenance: (maintenanceId: number) => void;
}

interface ChecklistItem {
    id: string;
    text: string;
    status: 'pending' | 'completed' | 'failed';
    notes?: string | null;
    updated_at?: string | null;
}

export default function MaintenanceListView({ 
    drive, 
    maintenances, 
    statusConfig,
    onOpenAddDialog,
    onStatusUpdate,
    onEditMaintenance,
    onDeleteMaintenance
}: MaintenanceListViewProps) {
    const [sortField, setSortField] = useState<'title' | 'maintenance_date' | 'technician' | 'status' | 'created_at'>('maintenance_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

    // Formatting utility functions
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        try {
            return format(new Date(dateStr), 'MMM d, yyyy');
        } catch (e) { return dateStr; }
    };
    
    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return '—';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getStatusBadge = (status: MaintenanceStatus, hasChecklistItems: boolean = false) => {
        const config = statusConfig.find(s => s.key === status) || statusConfig[0];
        
        return (
            <span 
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.iconColorClass} ${hasChecklistItems ? 'border border-dashed border-current' : ''}`}
                title={hasChecklistItems ? 'Status automatically managed by tasks' : 'Click to change status'}
            >
                <config.icon className="h-3.5 w-3.5" />
                <span>{config.label}</span>
                {hasChecklistItems && <span className="text-xs opacity-70">●</span>}
            </span>
        );
    };

    // Toggle sort when clicking on a column header
    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const toggleRowExpansion = (maintenanceId: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [maintenanceId]: !prev[maintenanceId]
        }));
    };

    // Filter and sort maintenances
    const filteredAndSortedMaintenances = useMemo(() => {
        // First, filter by search term and status
        const filtered = maintenances.filter(maintenance => {
            // Filter by status if not "all"
            if (statusFilter !== 'all' && maintenance.status !== statusFilter) {
                return false;
            }
            
            // Search in title, technician, and description
            if (search) {
                const searchLower = search.toLowerCase();
                return (
                    (maintenance.title && maintenance.title.toLowerCase().includes(searchLower)) ||
                    (maintenance.technician && maintenance.technician.toLowerCase().includes(searchLower)) ||
                    (maintenance.description && maintenance.description.toLowerCase().includes(searchLower))
                );
            }
            
            return true;
        });
        
        // Then sort by the selected field and direction
        return filtered.sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];
            
            // For dates, convert to Date objects for comparison
            if (sortField === 'maintenance_date' || sortField === 'created_at') {
                aValue = new Date(aValue || 0).getTime();
                bValue = new Date(bValue || 0).getTime();
            }
            
            // For strings, use localeCompare
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            // For other types, use simple comparison
            return sortDirection === 'asc' 
                ? (aValue > bValue ? 1 : -1)
                : (bValue > aValue ? 1 : -1);
        });
    }, [maintenances, search, statusFilter, sortField, sortDirection]);

    // Handle status change
    const handleStatusChange = async (maintenanceId: number, newStatus: MaintenanceStatus) => {
        // Find the maintenance to check if it has checklist items
        const maintenance = maintenances.find(m => m.id === maintenanceId);
        if (!maintenance) return;
        
        // Check if there are checklist items
        let hasChecklistItems = false;
        try {
            if (maintenance.checklist_json) {
                const checklist = typeof maintenance.checklist_json === 'string' 
                    ? JSON.parse(maintenance.checklist_json) 
                    : maintenance.checklist_json;
                hasChecklistItems = Array.isArray(checklist) && checklist.length > 0;
            }
        } catch (e) {
            hasChecklistItems = false;
        }
        
        // If there are checklist items, prevent manual status updates
        if (hasChecklistItems) {
            alert('Status is automatically managed based on task completion. Please update individual tasks instead.');
            return;
        }
        
        // Otherwise, proceed with manual status update
        await onStatusUpdate(maintenanceId, newStatus);
    };

    if (maintenances.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm mb-5">
                    <Wrench className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                    No maintenance records
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                    Log your first maintenance task to see it in the list.
                </p>
                <Button 
                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                    onClick={onOpenAddDialog}
                >
                    <PlusIcon className="h-4 w-4 mr-2" /> 
                    Create First Task
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        type="search"
                        placeholder="Search maintenance records..."
                        className="pl-9 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                {/* Status Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Status: {statusFilter === 'all' ? 'All' : statusConfig.find(s => s.key === statusFilter)?.label}
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                            <DropdownMenuItem 
                                className={statusFilter === 'all' ? 'bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20' : ''}
                                onClick={() => setStatusFilter('all')}
                            >
                                <span className="flex-1">All Statuses</span>
                                {statusFilter === 'all' && <CheckCircle2 className="h-4 w-4 text-[var(--emmo-green-primary)]" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {statusConfig.map((status) => (
                                <DropdownMenuItem 
                                    key={status.key}
                                    className={statusFilter === status.key ? 'bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20' : ''}
                                    onClick={() => setStatusFilter(status.key)}
                                >
                                    <status.icon className={`h-4 w-4 mr-2 ${status.iconColorClass}`} />
                                    <span className="flex-1">{status.label}</span>
                                    {statusFilter === status.key && <CheckCircle2 className="h-4 w-4 text-[var(--emmo-green-primary)]" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] px-2"></TableHead> {/* Expander Column */}
                                <TableHead 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    onClick={() => toggleSort('title')}
                                >
                                    <div className="flex items-center">
                                        Title
                                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === 'title' ? 'text-[var(--emmo-green-primary)]' : 'text-gray-400'}`} />
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    onClick={() => toggleSort('maintenance_date')}
                                >
                                    <div className="flex items-center">
                                        Date
                                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === 'maintenance_date' ? 'text-[var(--emmo-green-primary)]' : 'text-gray-400'}`} />
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    onClick={() => toggleSort('technician')}
                                >
                                    <div className="flex items-center">
                                        Technician
                                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === 'technician' ? 'text-[var(--emmo-green-primary)]' : 'text-gray-400'}`} />
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    onClick={() => toggleSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === 'status' ? 'text-[var(--emmo-green-primary)]' : 'text-gray-400'}`} />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Total Tasks</TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    onClick={() => toggleSort('created_at')}
                                >
                                    <div className="flex items-center">
                                        Created
                                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortField === 'created_at' ? 'text-[var(--emmo-green-primary)]' : 'text-gray-400'}`} />
                                    </div>
                                </TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedMaintenances.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center"> {/* Adjusted colSpan */}
                                        No results found. Try adjusting your search or filters.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredAndSortedMaintenances.map((maintenance) => {
                                let checklist: ChecklistItem[] = [];
                                if (maintenance.checklist_json) {
                                    try {
                                        const parsed = typeof maintenance.checklist_json === 'string'
                                            ? JSON.parse(maintenance.checklist_json)
                                            : maintenance.checklist_json;
                                        if (Array.isArray(parsed)) {
                                            // Handle both old and new format
                                            checklist = parsed.map(item => {
                                                // Convert old format (completed boolean) to new format (status)
                                                if (item && typeof item.id === 'string' && typeof item.text === 'string') {
                                                    if (typeof item.completed === 'boolean' && !('status' in item)) {
                                                        return {
                                                            id: item.id,
                                                            text: item.text,
                                                            status: item.completed ? 'completed' : 'pending',
                                                            notes: item.notes || null,
                                                            updated_at: item.updated_at || null
                                                        };
                                                    } else if (typeof item.status === 'string') {
                                                        return {
                                                            id: item.id,
                                                            text: item.text,
                                                            status: item.status,
                                                            notes: item.notes || null,
                                                            updated_at: item.updated_at || null
                                                        };
                                                    }
                                                }
                                                return null;
                                            }).filter(Boolean) as ChecklistItem[];
                                        }
                                    } catch (e) {
                                        console.error("Failed to parse checklist JSON for maintenance ID:", maintenance.id, e);
                                        checklist = []; // Ensure checklist is an empty array on error
                                    }
                                }
                                const isExpanded = expandedRows[maintenance.id];

                                return (
                                    <Fragment key={maintenance.id}>
                                        <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <TableCell className="px-2">
                                                {checklist.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleRowExpansion(maintenance.id)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium max-w-[200px] truncate" title={maintenance.title}>
                                                {maintenance.title}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                                    {formatDate(maintenance.maintenance_date)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {maintenance.technician ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-gray-500" />
                                                        <span>{maintenance.technician}</span>
                                                    </div>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="w-full text-left" disabled={checklist.length > 0}>
                                                            {getStatusBadge(maintenance.status, checklist.length > 0)}
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-48">
                                                        {checklist.length > 0 ? (
                                                            <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                Status is automatically managed based on task completion
                                                            </div>
                                                        ) : (
                                                            <DropdownMenuGroup>
                                                                {statusConfig.map((status) => (
                                                                    <DropdownMenuItem 
                                                                        key={status.key}
                                                                        className={maintenance.status === status.key ? 'bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20' : ''}
                                                                        onClick={() => handleStatusChange(maintenance.id, status.key)}
                                                                        disabled={maintenance.status === status.key}
                                                                    >
                                                                        <status.icon className={`h-4 w-4 mr-2 ${status.iconColorClass}`} />
                                                                        <span className="flex-1">{status.label}</span>
                                                                        {maintenance.status === status.key && <CheckCircle2 className="h-4 w-4 text-[var(--emmo-green-primary)]" />}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuGroup>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(() => {
                                                    try {
                                                        if (!maintenance.checklist_json) return '0 / 0';
                                                        
                                                        const checklist = typeof maintenance.checklist_json === 'string' 
                                                            ? JSON.parse(maintenance.checklist_json) 
                                                            : maintenance.checklist_json;
                                                            
                                                        if (!Array.isArray(checklist)) return '0 / 0';
                                                        
                                                        const total = checklist.length;
                                                        const completed = checklist.filter(item => 
                                                            item.status === 'completed' || (item.completed === true && !('status' in item))
                                                        ).length;
                                                        
                                                        return `${completed} / ${total}`;
                                                    } catch (e) {
                                                        return '0 / 0';
                                                    }
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {format(new Date(maintenance.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted">
                                                            <MoreVertical className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem onClick={() => onEditMaintenance(maintenance)}>
                                                            <Edit3 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onDeleteMaintenance(maintenance.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-700/20 dark:focus:text-red-500">
                                                            <Trash2 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow className="bg-gray-50 dark:bg-gray-800/10">
                                                <TableCell colSpan={10} className="p-0">
                                                    <div className="p-4">
                                                        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            <Clipboard className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                                            Maintenance Tasks
                                                        </h4>
                                                        <MaintenanceChecklist
                                                            maintenanceId={maintenance.id}
                                                            checklistItems={typeof maintenance.checklist_json === 'string'
                                                                ? JSON.parse(maintenance.checklist_json || '[]')
                                                                : maintenance.checklist_json || []
                                                            }
                                                            onUpdate={(stats) => {
                                                                // Refresh the UI with updated stats
                                                                // This is optional as our component handles the UI updates internally
                                                            }}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </ Fragment> 
                                )})}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Empty state when filtered results are empty */}
                {filteredAndSortedMaintenances.length === 0 && (
                    <div className="text-center py-12 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No matching records
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Try adjusting your search or filter to find what you're looking for.
                        </p>
                        <Button 
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('all');
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
} 