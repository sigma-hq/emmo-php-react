import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  HardDrive,
  User,
  ChevronRight,
  ChevronDown,
  PlusIcon,
  ClipboardList,
  ArrowUpDown,
  X,
  Clipboard,
  Download,
  MessageSquare,
  Camera,
} from 'lucide-react';
import { format } from 'date-fns';

import MaintenanceChecklist from '@/components/ui/maintenance-checklist';
import BarcodeScanner from '@/components/ui/barcode-scanner';
import { useDriveBarcodeSearch } from '@/hooks/useBarcodeScanner';

interface Drive {
  id: number;
  name: string;
  drive_ref: string;
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
  checklist_json?: string;
  created_at: string;
  updated_at: string;
  drive?: Drive;
  user?: {
    id: number;
    name: string;
  };
}

interface DriveOption {
  id: number;
  name: string;
  drive_ref: string;
}

interface MaintenancesPageProps {
  maintenances: {
    data: Maintenance[];
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
  statuses: Record<string, string>;
  filters: {
    search: string;
    status: string;
  };
  drives?: DriveOption[];
}

interface ChecklistItem {
  id: string;
  text: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string | null;
  updated_at?: string | null;
}

// Status configuration
const statusConfig = [
  {
    key: 'pending' as MaintenanceStatus,
    label: 'To Do',
    icon: Clock,
    bgClass: 'bg-amber-50 dark:bg-amber-900/10',
    iconColorClass: 'text-amber-500',
  },
  {
    key: 'in_progress' as MaintenanceStatus,
    label: 'In Progress',
    icon: Wrench,
    bgClass: 'bg-blue-50 dark:bg-blue-900/10',
    iconColorClass: 'text-blue-500',
  },
  {
    key: 'completed' as MaintenanceStatus,
    label: 'Completed',
    icon: CheckCircle2,
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/10',
    iconColorClass: 'text-emerald-500',
  },
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Maintenances',
        href: '/maintenances',
    },
];

interface FormData {
  drive_id: string;
  title: string;
  description: string;
  maintenance_date: string;
  technician: string;
  status: MaintenanceStatus;
  cost: string;
  checklist_json: string;
}

export default function Maintenances({ maintenances, statuses, filters }: MaintenancesPageProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [sortField, setSortField] = useState<'title' | 'maintenance_date' | 'status'>('maintenance_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Barcode scanner functionality
  const { handleBarcodeScan } = useDriveBarcodeSearch({
    targetRoute: 'maintenances',
    queryParamName: 'search',
    inertiaOptions: { preserveState: true, preserveScroll: true },
    onApplied: (code) => setSearchTerm(code),
  });

  // Get flash messages from Inertia
  const { flash } = usePage<{ flash: { success?: string } }>().props;

  // Form for creating a new maintenance record
  const { setData } = useForm<FormData>({
    drive_id: '',
    title: '',
    description: '',
    maintenance_date: format(new Date(), 'yyyy-MM-dd'),
    technician: '',
    status: 'pending' as MaintenanceStatus,
    cost: '',
    checklist_json: '[]'
  });

  // Handle flash messages from the backend
  useEffect(() => {
    if (flash?.success) {
      setSuccessMessage(flash.success);
      setShowSuccessMessage(true);
      
      // Auto-hide the notification after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // Show success message
  const displaySuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(
        route('maintenances'),
        { search: searchTerm, status: statusFilter },
        { preserveState: true, preserveScroll: true }
      );
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    router.get(
      route('maintenances'),
      { search: searchTerm, status: value },
      { preserveState: true, preserveScroll: true }
    );
  };

  // Handle pagination
  const goToPage = (page: number) => {
    router.get(
      route('maintenances'),
      { search: searchTerm, status: statusFilter, page },
      { preserveState: true, preserveScroll: true }
    );
  };

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch { return dateStr; }
  };

  // Get status badge
  const getStatusBadge = (status: MaintenanceStatus, hasChecklistItems: boolean = false) => {
    const config = statusConfig.find(s => s.key === status) || statusConfig[0];
    
    return (
      <span 
        className={`status-badge inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.iconColorClass} ${hasChecklistItems ? 'border border-dashed border-current' : ''}`}
        title={hasChecklistItems ? 'Status automatically managed by tasks' : 'Click to change status'}
      >
        <config.icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
        {hasChecklistItems && <span className="text-xs opacity-70">●</span>}
      </span>
    );
  };

  // Handle sort
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (maintenanceId: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [maintenanceId]: !prev[maintenanceId]
    }));
  };

  // Handle status update
  const handleStatusUpdate = async (maintenanceId: number, newStatus: MaintenanceStatus) => {
    // Find the maintenance to check if it has checklist items
    const maintenance = maintenances.data.find(m => m.id === maintenanceId);
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
    
    // Use Inertia.js for status update
    router.put(
      route('api.maintenances.update', { maintenance: maintenanceId }), 
      { status: newStatus },
      {
        preserveScroll: true,
        onSuccess: () => {
          displaySuccessMessage('Status updated successfully');
          
          // Refresh data
          router.reload({ only: ['maintenances'] });
        },
        onError: () => {
          displaySuccessMessage('Failed to update status. Please try again.');
        }
      }
    );
  };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Maintenance Records" />
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow flex items-center gap-2 animate-in slide-in-from-top-5">
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
      
      <div className="flex h-full flex-1 flex-col gap-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-[var(--emmo-green-primary)]" />
              <h1 className="text-2xl font-bold tracking-tight">Maintenance Records</h1>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsScannerOpen(true)}
                className="border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Barcode
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const params = new URLSearchParams();
                  if (searchTerm) params.append('search', searchTerm);
                  if (statusFilter) params.append('status', statusFilter);
                  window.open(`/maintenances/export?${params.toString()}`, '_blank');
                  displaySuccessMessage('CSV export initiated. Check your downloads folder.');
                }}
                className="border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            View and manage all maintenance records across drives. Schedule maintenance tasks and track their completion status.
          </p>
        </div>
        
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <Input
              type="text"
              placeholder="Search maintenance records..."
              className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statuses).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Export and Related Inspections Links */}
          <div className="ml-auto flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                const params = new URLSearchParams();
                if (searchTerm) params.append('search', searchTerm);
                if (statusFilter) params.append('status', statusFilter);
                window.open(`/maintenances/export?${params.toString()}`, '_blank');
                displaySuccessMessage('CSV export initiated. Check your downloads folder.');
              }}
              className="border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" asChild className="border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              <Link href={route('inspections')}>
                <ClipboardList className="h-4 w-4 mr-2" />
                View Inspections
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Maintenance Records Table */}
        {maintenances.data.length > 0 ? (
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  <TableHead className="w-[40px] px-2"></TableHead> {/* Expander Column */}
                  <TableHead onClick={() => toggleSort('title')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Title
                      {sortField === 'title' && (
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Drive</TableHead>
                  <TableHead onClick={() => toggleSort('maintenance_date')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Date
                      {sortField === 'maintenance_date' && (
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                                          <TableHead>Operator</TableHead>
                  <TableHead onClick={() => toggleSort('status')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === 'status' && (
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Tasks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenances.data
                  .sort((a, b) => {
                    if (sortField === 'maintenance_date') {
                      const dateA = new Date(a.maintenance_date || 0).getTime();
                      const dateB = new Date(b.maintenance_date || 0).getTime();
                      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                    }
                    
                    if (typeof a[sortField] === 'string' && typeof b[sortField] === 'string') {
                      return sortDirection === 'asc'
                        ? a[sortField].localeCompare(b[sortField])
                        : b[sortField].localeCompare(a[sortField]);
                    }
                    
                    return 0;
                  })
                  .map((maintenance) => {
                    // Parse checklist items
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
                        checklist = [];
                      }
                    }
                    const isExpanded = expandedRows[maintenance.id];

                    return (
                      <Fragment key={maintenance.id}>
                        <TableRow 
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50" 
                          data-maintenance-id={maintenance.id}
                        >
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
                          <TableCell className="font-medium">{maintenance.title}</TableCell>
                          <TableCell>
                            {maintenance.drive ? (
                              <Link 
                                href={route('api.drives.show', maintenance.drive.id)}
                                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <HardDrive className="h-3.5 w-3.5" />
                                <span>{maintenance.drive.name}</span>
                              </Link>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-500" />
                              <span>{formatDate(maintenance.maintenance_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {maintenance.technician ? (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-gray-500" />
                                <span>{maintenance.technician}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Not assigned</span>
                            )}
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
                                        onClick={() => handleStatusUpdate(maintenance.id, status.key)}
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
                            <div className="flex items-center justify-end gap-1">
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
                                  
                                  const hasNotes = checklist.some(item => item.notes && item.notes.trim());
                                  
                                  return (
                                    <>
                                      <span>{completed} / {total}</span>
                                      {hasNotes && (
                                        <MessageSquare className="h-3 w-3 text-blue-500" title="Tasks have notes" />
                                      )}
                                    </>
                                  );
                                } catch (e) {
                                  return '0 / 0';
                                }
                              })()}
                            </div>
                          </TableCell>
                          
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-gray-50 dark:bg-gray-800/30">
                            <TableCell colSpan={8} className="p-0">
                              <div className="p-4">
                                <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <Clipboard className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                  Maintenance Tasks
                                </h4>
                                <MaintenanceChecklist
                                  maintenanceId={maintenance.id}
                                  checklistItems={checklist}
                                  onUpdate={() => {
                                  }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center bg-white/50 dark:bg-gray-900/50">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
              <Wrench className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-1 text-gray-900 dark:text-gray-100">No maintenance records found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
              There are no maintenance records matching your filters. Try changing your search or create a new maintenance record.
            </p>
            <Button 
              className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
              onClick={() => setIsDialogOpen(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Create Maintenance Record
            </Button>
          </div>
        )}
        
        {/* Pagination */}
        {maintenances.data.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{maintenances.data.length}</span> of <span className="font-medium">{maintenances.total}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => goToPage(maintenances.current_page - 1)}
                disabled={maintenances.current_page === 1}
                className="border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {maintenances.current_page} of {maintenances.last_page}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => goToPage(maintenances.current_page + 1)}
                disabled={maintenances.current_page === maintenances.last_page}
                className="border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
            </div>
            
            {/* Barcode Scanner Dialog */}
            <BarcodeScanner 
              isOpen={isScannerOpen}
              onClose={() => setIsScannerOpen(false)}
              onScan={handleBarcodeScan}
              title="Scan Drive Barcode"
              description="Position the drive's barcode within the camera view to find maintenance records for that drive."
            />
        </AppLayout>
    );
} 