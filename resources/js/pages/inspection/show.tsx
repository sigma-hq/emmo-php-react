import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { 
    PlusIcon, 
    Pencil, 
    Trash2, 
    CheckCircle, 
    ClipboardList, 
    ArrowLeft, 
    XIcon, 
    AlertTriangle, 
    Clock, 
    ClipboardCheck, 
    ClipboardX,
    Archive,
    BarChart3,
    FileSpreadsheet,
    Info,
    FileText,
    CheckSquare,
    ChevronRight,
    Clipboard,
    PieChart,
    CheckSquare as CheckSquareIcon,
    ChevronsUpDown,
    Search,
    Check
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
import Chart from 'react-apexcharts';
import { cn } from '@/lib/utils';

// Import Tab Components
import OverviewTab from './tabs/overview-tab';
import TasksTab from './tabs/tasks-tab';
import ResultsTab from './tabs/results-tab';

// Define interfaces directly in this file or import from a central types file
// --- EXPORT the interfaces --- 
export interface User {
    id: number;
    name: string;
}

export interface Drive {
    id: number;
    name: string;
    drive_ref: string;
}

export interface Part {
    id: number;
    name: string;
    part_ref: string;
}

export interface InspectionResult {
    id: number;
    inspection_id: number;
    task_id: number;
    performed_by: number | null;
    value_boolean: boolean | null;
    value_numeric: number | null;
    is_passing: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
    performer?: User;
}

export interface InspectionSubTask {
    id: number;
    inspection_task_id: number;
    name: string;
    description: string | null;
    type: 'yes_no' | 'numeric' | 'none';
    status: 'pending' | 'completed'; // Overall status of the subtask action itself
    expected_value_boolean: boolean | null;
    expected_value_min: number | null;
    expected_value_max: number | null;
    unit_of_measure: string | null;
    recorded_value_boolean: boolean | null;
    recorded_value_numeric: number | null;
    compliance: 'passing' | 'failing' | 'warning' | 'pending_action' | 'pending_result' | 'complete' | 'misconfigured' | 'unknown'; // Added
    completed_by: number | null;
    completed_at: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    completedBy?: User;
}

export interface InspectionTask {
    id: number;
    inspection_id: number;
    name: string;
    description: string | null;
    type: 'yes_no' | 'numeric';
    target_type: 'drive' | 'part' | null;
    target_id: number | null;
    expected_value_boolean: boolean | null;
    expected_value_min: number | null;
    expected_value_max: number | null;
    unit_of_measure: string | null;
    results?: InspectionResult[];
    subTasks?: InspectionSubTask[];
    sub_tasks?: InspectionSubTask[];
}

export interface Inspection {
    id: number;
    name: string;
    description: string | null;
    status: 'draft' | 'active' | 'completed' | 'archived';
    created_by: number;
    created_at: string;
    updated_at: string;
    creator?: User;
    tasks?: InspectionTask[];
    is_template: boolean;
    parent_inspection_id?: number | null;
    schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    schedule_interval?: number | null;
    schedule_start_date?: string | Date | null;
    schedule_end_date?: string | Date | null;
    schedule_next_due_date?: string | null;
    schedule_last_created_at?: string | null;
    parentTemplate?: Inspection | null;
}

interface InspectionShowProps {
    inspection: Inspection;
    drives: Drive[];
    parts: Part[];
    flash?: {
        success?: string;
    };
    isAdmin?: boolean;
}

// Simple Progress component since we don't have the UI component
const Progress = ({ value, className = "" }: { value: number, className?: string }) => (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${className}`}>
        <div 
            className="h-full bg-gray-500 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${value}%` }}
        />
    </div>
);

export default function InspectionShow({ inspection, drives, parts, flash, isAdmin }: InspectionShowProps) {
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Task Dialog
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isEditTaskMode, setIsEditTaskMode] = useState(false);
    const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<InspectionTask | null>(null);
    
    // Result Dialog
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
    
    const [resultsErrorMessage, setResultsErrorMessage] = useState<string | null>(null);

    // State for Drive Combobox
    const [isDriveComboOpen, setIsDriveComboOpen] = useState(false);
    const [driveComboSearchTerm, setDriveComboSearchTerm] = useState('');

    // State for Part Combobox
    const [isPartComboOpen, setIsPartComboOpen] = useState(false);
    const [partComboSearchTerm, setPartComboSearchTerm] = useState('');
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Inspections',
            href: '/inspections',
        },
        {
            title: inspection.name,
            href: route('inspections.show', inspection.id),
        },
    ];
    
    // Task form
    const taskForm = useForm({
        id: '',
        inspection_id: inspection.id.toString(),
        name: '',
        description: '',
        type: 'yes_no' as 'yes_no' | 'numeric',
        target_type: 'none',
        target_id: '',
        expected_value_boolean: 'true',
        expected_value_min: '',
        expected_value_max: '',
        unit_of_measure: '',
    });
    
    // Result form
    const resultForm = useForm({
        task_type: 'yes_no' as 'yes_no' | 'numeric',
        value_boolean: 'true',
        value_numeric: '',
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
    
    const openCreateTaskDialog = () => {
        taskForm.reset();
        taskForm.setData('inspection_id', inspection.id.toString());
        setIsEditTaskMode(false);
        setIsTaskDialogOpen(true);
        setDriveComboSearchTerm('');
        setPartComboSearchTerm('');
    };
    
    const openEditTaskDialog = (task: InspectionTask) => {
        taskForm.reset();
        taskForm.setData({
            id: task.id.toString(),
            inspection_id: inspection.id.toString(),
            name: task.name,
            description: task.description || '',
            type: task.type,
            target_type: task.target_type || 'none',
            target_id: task.target_id ? task.target_id.toString() : '',
            expected_value_boolean: task.expected_value_boolean !== null ? task.expected_value_boolean.toString() : 'true',
            expected_value_min: task.expected_value_min !== null ? task.expected_value_min.toString() : '',
            expected_value_max: task.expected_value_max !== null ? task.expected_value_max.toString() : '',
            unit_of_measure: task.unit_of_measure || '',
        });
        setIsEditTaskMode(true);
        setIsTaskDialogOpen(true);
        setDriveComboSearchTerm('');
        setPartComboSearchTerm('');
    };
    
    const openDeleteTaskDialog = (task: InspectionTask) => {
        setTaskToDelete(task);
        setShowDeleteTaskDialog(true);
    };
    
    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Log submission for debugging
        console.log('Submitting task form with data:', taskForm.data);
        
        if (isEditTaskMode) {
            taskForm.put(route('inspection-tasks.update', taskForm.data.id), {
                onSuccess: () => {
                    setIsTaskDialogOpen(false);
                    // Inertia handles the page refresh automatically
                },
                onError: (errors) => {
                    console.error('Form submission errors:', errors);
                }
            });
        } else {
            taskForm.post(route('inspection-tasks.store'), {
                onSuccess: () => {
                    setIsTaskDialogOpen(false);
                    // Inertia handles the page refresh automatically
                },
                onError: (errors) => {
                    console.error('Form submission errors:', errors);
                }
            });
        }
    };
    
    const handleTaskDelete = () => {
        if (taskToDelete) {
            router.delete(route('inspection-tasks.destroy', taskToDelete.id), {
                onSuccess: () => {
                    setShowDeleteTaskDialog(false);
                    setTaskToDelete(null);
                    // Inertia handles the page refresh automatically
                },
                onError: (errors) => {
                    console.error('Task deletion error:', errors);
                }
            });
        }
    };
    
    const openRecordResultDialog = (task: InspectionTask) => {
        resultForm.reset();
        
        // Set default value for yes/no tasks based on expected value
        if (task.type === 'yes_no' && task.expected_value_boolean !== null) {
            resultForm.setData({
                task_type: task.type,
                // Default to the expected value for convenience
                value_boolean: task.expected_value_boolean.toString(),
                value_numeric: '',
                notes: '',
            });
        } else {
            resultForm.setData({
                task_type: task.type,
                value_boolean: 'true',
                value_numeric: '',
                notes: '',
            });
        }
        
        setSelectedTask(task);
        setIsResultDialogOpen(true);
    };
    
    const handleResultSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous error message
        setResultsErrorMessage(null);
        
        // Log submission for debugging
        console.log('Submitting result form with data:', resultForm.data);
        console.log('Selected task:', selectedTask);
        
        if (selectedTask) {
            router.post(route('inspection-tasks.record-result', selectedTask.id), {
                ...resultForm.data,
                // Convert string to boolean for yes/no tasks
                value_boolean: resultForm.data.task_type === 'yes_no' 
                    ? (resultForm.data.value_boolean === 'true') 
                    : undefined
            }, {
                onSuccess: () => {
                    setIsResultDialogOpen(false);
                    // Inertia handles the page refresh automatically
                },
                onError: (errors) => {
                    console.error('Result submission errors:', errors);
                    if (errors.message && errors.message.includes('subtask')) {
                        setResultsErrorMessage(errors.message);
                    }
                }
            });
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
    
    // Calculate inspection summary data
    const tasksCount = inspection.tasks?.length || 0;
    const resultsCount = inspection.tasks?.reduce((acc, task) => acc + (task.results?.length || 0), 0) || 0;
    const passedCount = inspection.tasks?.reduce((acc, task) => {
        return acc + (task.results?.filter(r => r.is_passing)?.length || 0);
    }, 0) || 0;
    const failedCount = resultsCount - passedCount;
    const completionPercentage = tasksCount > 0 ? Math.round((resultsCount / tasksCount) * 100) : 0;

    const getSelectedDriveName = () => {
        if (!taskForm.data.target_id) return null;
        const selectedDrive = drives.find(drive => drive.id.toString() === taskForm.data.target_id);
        return selectedDrive ? `${selectedDrive.name} (${selectedDrive.drive_ref})` : null;
    };

    const getSelectedPartName = () => {
        if (!taskForm.data.target_id) return null;
        const selectedPart = parts.find(part => part.id.toString() === taskForm.data.target_id);
        return selectedPart ? `${selectedPart.name} (${selectedPart.part_ref})` : null;
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Inspection: ${inspection.name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Success Notification */}
                {showSuccessNotification && (
                    <div className="fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out">
                        <div className="flex items-center gap-3 bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow-lg">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">{successMessage}</p>
                        </div>
                    </div>
                )}
                
                {/* Header - Updated Style */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-full h-8 gap-1"
                        >
                            <Link href={route('inspections')}>
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back</span>
                            </Link>
                        </Button>
                        
                        {/* Add Task button moved to the Tasks Tab section later */}
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                        <div className="flex gap-4 items-center">
                            <div className="bg-green-50 p-3 rounded-full">
                                <ClipboardList className="h-7 w-7 text-green-700" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold">{inspection.name}</h1>
                                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200">
                                        ID: #{inspection.id}
                                    </Badge>
                                    <Badge className={getStatusBadgeClasses(inspection.status)}>
                                        <span className="flex items-center gap-1">
                                            {getStatusIcon(inspection.status)}
                                            {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                                        </span>
                                    </Badge>
                                </div>
                                {inspection.description && (
                                    <p className="text-gray-500 mt-1 max-w-xl">{inspection.description}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-3 self-start md:self-center">
                            {/* Optional: Add Edit/Share buttons here if needed, similar to Drive page */}
                            {isAdmin && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={openCreateTaskDialog} // Keep Add Task accessible 
                                    className="h-9"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Task
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Inspection Content Tabs - Full Width */}
                <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                    <TabsList className="grid sm:w-full md:w-2xl grid-cols-3">
                        {/* Tab Triggers remain the same */}
                         <TabsTrigger value="overview" className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" />
                            Tasks ({tasksCount})
                        </TabsTrigger>
                        <TabsTrigger value="results" className="flex items-center gap-1">
                            <FileSpreadsheet className="h-4 w-4" />
                            Results ({resultsCount})
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6 flex-1">
                        {/* Tab Content will be replaced by imported components */}
                        <TabsContent value="overview" className="h-full">
                           <OverviewTab 
                                inspection={inspection}
                                tasksCount={tasksCount}
                                resultsCount={resultsCount}
                                passedCount={passedCount}
                                failedCount={failedCount}
                                completionPercentage={completionPercentage}
                                getStatusBadgeClasses={getStatusBadgeClasses}
                                getStatusIcon={getStatusIcon}
                           />
                        </TabsContent>
                        
                        <TabsContent value="tasks" className="h-full">
                           <TasksTab 
                                tasks={inspection.tasks || []}
                                openCreateTaskDialog={openCreateTaskDialog}
                                openEditTaskDialog={openEditTaskDialog}
                                openDeleteTaskDialog={openDeleteTaskDialog}
                                openRecordResultDialog={openRecordResultDialog}
                                isAdmin={isAdmin}
                           />
                        </TabsContent>
                        
                        <TabsContent value="results" className="h-full">
                            <ResultsTab 
                                inspection={inspection}
                                resultsCount={resultsCount}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
                
                {/* Task Form Dialog */}
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
                        <form onSubmit={handleTaskSubmit} className="flex flex-col h-full">
                            {/* Header with visual treatment */}
                            <div className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-2">
                                    {isEditTaskMode ? 'Edit Task' : 'Add New Task'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 max-w-sm">
                                    {isEditTaskMode 
                                        ? 'Update the task details below.' 
                                        : 'Fill in the task details below to create a new task.'}
                                </DialogDescription>
                            </div>
                            <div className="grid gap-4 p-6 overflow-y-auto">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className={taskForm.errors.name ? "text-red-500" : ""}>
                                        Task Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={taskForm.data.name}
                                        onChange={(e) => taskForm.setData('name', e.target.value)}
                                        className={taskForm.errors.name ? "border-red-500" : ""}
                                    />
                                    {taskForm.errors.name && (
                                        <p className="text-sm text-red-500">{taskForm.errors.name}</p>
                                    )}
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description (Optional)
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={taskForm.data.description}
                                        onChange={(e) => taskForm.setData('description', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="type" className={taskForm.errors.type ? "text-red-500" : ""}>
                                        Task Type
                                    </Label>
                                    <Select
                                        value={taskForm.data.type}
                                        onValueChange={(value: 'yes_no' | 'numeric') => taskForm.setData('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select task type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes_no">Yes/No Question</SelectItem>
                                            <SelectItem value="numeric">Numeric Measurement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {taskForm.errors.type && (
                                        <p className="text-sm text-red-500">{taskForm.errors.type}</p>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="target_type">
                                            Applies To (Optional)
                                        </Label>
                                        <Select
                                            value={taskForm.data.target_type}
                                            onValueChange={(value) => taskForm.setData('target_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select target type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="drive">Drive</SelectItem>
                                                <SelectItem value="part">Part</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {taskForm.data.target_type === 'drive' ? (
                                        // Drive Select using portaled Select
                                        <div className="grid gap-2">
                                            <Label htmlFor="target_id" className={taskForm.errors.target_id ? "text-red-500" : ""}>
                                                Select Drive
                                            </Label>
                                            <Select
                                                value={taskForm.data.target_id || ''}
                                                onValueChange={value => taskForm.setData('target_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a drive..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="p-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Search drives..."
                                                            className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 p-0 mb-2"
                                                            value={driveComboSearchTerm}
                                                            onChange={e => setDriveComboSearchTerm(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto">
                                                        {drives
                                                            .filter(drive =>
                                                                drive.name.toLowerCase().includes(driveComboSearchTerm.toLowerCase()) ||
                                                                drive.drive_ref.toLowerCase().includes(driveComboSearchTerm.toLowerCase())
                                                            )
                                                            .map(drive => (
                                                                <SelectItem key={drive.id} value={drive.id.toString()}>
                                                                    {drive.name} <span className="ml-2 text-xs text-gray-500">({drive.drive_ref})</span>
                                                                </SelectItem>
                                                            ))}
                                                        {drives.filter(drive =>
                                                            drive.name.toLowerCase().includes(driveComboSearchTerm.toLowerCase()) ||
                                                            drive.drive_ref.toLowerCase().includes(driveComboSearchTerm.toLowerCase())
                                                        ).length === 0 && (
                                                            <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                                No drives found.
                                                            </div>
                                                        )}
                                                    </div>
                                                </SelectContent>
                                            </Select>
                                            {taskForm.errors.target_id && (
                                                <p className="text-sm text-red-500">{taskForm.errors.target_id}</p>
                                            )}
                                        </div>
                                    ) : (
                                        // Part Select using portaled Select
                                        <div className="grid gap-2">
                                            <Label htmlFor="target_id" className={taskForm.errors.target_id ? "text-red-500" : ""}>
                                                Select Part
                                            </Label>
                                            <Select
                                                value={taskForm.data.target_id || ''}
                                                onValueChange={value => taskForm.setData('target_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a part..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="p-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Search parts..."
                                                            className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 p-0 mb-2"
                                                            value={partComboSearchTerm}
                                                            onChange={e => setPartComboSearchTerm(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto">
                                                        {parts
                                                            .filter(part =>
                                                                part.name.toLowerCase().includes(partComboSearchTerm.toLowerCase()) ||
                                                                part.part_ref.toLowerCase().includes(partComboSearchTerm.toLowerCase())
                                                            )
                                                            .map(part => (
                                                                <SelectItem key={part.id} value={part.id.toString()}>
                                                                    {part.name} <span className="ml-2 text-xs text-gray-500">({part.part_ref})</span>
                                                                </SelectItem>
                                                            ))}
                                                        {parts.filter(part =>
                                                            part.name.toLowerCase().includes(partComboSearchTerm.toLowerCase()) ||
                                                            part.part_ref.toLowerCase().includes(partComboSearchTerm.toLowerCase())
                                                        ).length === 0 && (
                                                            <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                                No parts found.
                                                            </div>
                                                        )}
                                                    </div>
                                                </SelectContent>
                                            </Select>
                                            {taskForm.errors.target_id && (
                                                <p className="text-sm text-red-500">{taskForm.errors.target_id}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {taskForm.data.type === 'yes_no' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="expected_value_boolean" className={taskForm.errors.expected_value_boolean ? "text-red-500" : ""}>
                                            Expected Value
                                        </Label>
                                        <RadioGroup
                                            value={taskForm.data.expected_value_boolean}
                                            onValueChange={(value) => taskForm.setData('expected_value_boolean', value)}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="true" id="yes" />
                                                <Label htmlFor="yes">Yes</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="false" id="no" />
                                                <Label htmlFor="no">No</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )}
                                
                                {taskForm.data.type === 'numeric' && (
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="expected_value_min" className={taskForm.errors.expected_value_min ? "text-red-500" : ""}>
                                                    Minimum Value
                                                </Label>
                                                <Input
                                                    id="expected_value_min"
                                                    type="number"
                                                    step="any"
                                                    value={taskForm.data.expected_value_min}
                                                    onChange={(e) => taskForm.setData('expected_value_min', e.target.value)}
                                                    className={taskForm.errors.expected_value_min ? "border-red-500" : ""}
                                                />
                                                {taskForm.errors.expected_value_min && (
                                                    <p className="text-sm text-red-500">{taskForm.errors.expected_value_min}</p>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="expected_value_max" className={taskForm.errors.expected_value_max ? "text-red-500" : ""}>
                                                    Maximum Value
                                                </Label>
                                                <Input
                                                    id="expected_value_max"
                                                    type="number"
                                                    step="any"
                                                    value={taskForm.data.expected_value_max}
                                                    onChange={(e) => taskForm.setData('expected_value_max', e.target.value)}
                                                    className={taskForm.errors.expected_value_max ? "border-red-500" : ""}
                                                />
                                                {taskForm.errors.expected_value_max && (
                                                    <p className="text-sm text-red-500">{taskForm.errors.expected_value_max}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-2">
                                            <Label htmlFor="unit_of_measure">
                                                Unit of Measure
                                            </Label>
                                            <Input
                                                id="unit_of_measure"
                                                placeholder="e.g., mm, kg, °C"
                                                value={taskForm.data.unit_of_measure}
                                                onChange={(e) => taskForm.setData('unit_of_measure', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsTaskDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={taskForm.processing}
                                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                                >
                                    {isEditTaskMode ? 'Update Task' : 'Add Task'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                
                {/* Delete Task Confirmation */}
                <AlertDialog open={showDeleteTaskDialog} onOpenChange={setShowDeleteTaskDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the task 
                                <span className="font-medium"> {taskToDelete?.name}</span>. 
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleTaskDelete}
                                className="bg-red-500 text-white hover:bg-red-600"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                {/* Record Result Dialog */}
                <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                Record Result
                            </DialogTitle>
                            <DialogDescription>
                                {selectedTask && `Record the result for: ${selectedTask.name}`}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResultSubmit}>
                            {resultsErrorMessage && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm">{resultsErrorMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="grid gap-4 py-4">
                                {resultForm.data.task_type === 'yes_no' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="value_boolean">
                                            Result
                                        </Label>
                                        <RadioGroup
                                            value={resultForm.data.value_boolean}
                                            onValueChange={(value) => resultForm.setData('value_boolean', value)}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="true" id="result_yes" />
                                                <Label htmlFor="result_yes">Yes</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="false" id="result_no" />
                                                <Label htmlFor="result_no">No</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )}
                                
                                {resultForm.data.task_type === 'numeric' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="value_numeric" className={resultForm.errors.value_numeric ? "text-red-500" : ""}>
                                            Measured Value
                                        </Label>
                                        <Input
                                            id="value_numeric"
                                            type="number"
                                            step="any"
                                            value={resultForm.data.value_numeric}
                                            onChange={(e) => resultForm.setData('value_numeric', e.target.value)}
                                            className={resultForm.errors.value_numeric ? "border-red-500" : ""}
                                        />
                                        {resultForm.errors.value_numeric && (
                                            <p className="text-sm text-red-500">{resultForm.errors.value_numeric}</p>
                                        )}
                                    </div>
                                )}
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="notes">
                                        Notes (Optional)
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={resultForm.data.notes}
                                        onChange={(e) => resultForm.setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsResultDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={resultForm.processing}
                                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                                >
                                    Save Result
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
} 