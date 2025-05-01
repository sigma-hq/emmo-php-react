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
    CheckIcon, 
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
    Clipboard
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';

interface User {
    id: number;
    name: string;
}

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
}

interface Part {
    id: number;
    name: string;
    part_ref: string;
}

interface InspectionTask {
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
}

interface InspectionResult {
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

interface Inspection {
    id: number;
    name: string;
    description: string | null;
    status: 'draft' | 'active' | 'completed' | 'archived';
    created_by: number;
    created_at: string;
    updated_at: string;
    creator?: User;
    tasks?: InspectionTask[];
}

interface InspectionShowProps {
    inspection: Inspection;
    drives: Drive[];
    parts: Part[];
    flash?: {
        success?: string;
    };
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

export default function InspectionShow({ inspection, drives, parts, flash }: InspectionShowProps) {
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
            href: route('api.inspections.show', inspection.id),
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
            taskForm.put(route('api.inspection-tasks.update', taskForm.data.id), {
                onSuccess: () => {
                    setIsTaskDialogOpen(false);
                    window.location.reload(); // Force reload to see changes
                },
                onError: (errors) => {
                    console.error('Form submission errors:', errors);
                }
            });
        } else {
            taskForm.post(route('api.inspection-tasks.store'), {
                onSuccess: () => {
                    setIsTaskDialogOpen(false);
                    window.location.reload(); // Force reload to see changes
                },
                onError: (errors) => {
                    console.error('Form submission errors:', errors);
                }
            });
        }
    };
    
    const handleTaskDelete = () => {
        if (taskToDelete) {
            router.delete(route('api.inspection-tasks.destroy', taskToDelete.id));
            setShowDeleteTaskDialog(false);
            setTaskToDelete(null);
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
        
        // Log submission for debugging
        console.log('Submitting result form with data:', resultForm.data);
        console.log('Selected task:', selectedTask);
        
        if (selectedTask) {
            // Manual data preparation
            const formData = new FormData();
            formData.append('task_type', resultForm.data.task_type);
            formData.append('notes', resultForm.data.notes);
            
            // Always send both fields, but set appropriate values based on task type
            if (resultForm.data.task_type === 'yes_no') {
                // Convert string to boolean for the server
                // The backend expects a boolean value that will be compared with the task's expected_value_boolean
                const boolValue = resultForm.data.value_boolean === 'true';
                
                // Send as actual boolean - the Laravel controller will validate and process it correctly
                formData.append('value_boolean', boolValue ? '1' : '0');
                formData.append('value_numeric', ''); // Send empty string for numeric value
                
                console.log('Sending boolean value:', boolValue ? '1' : '0', 'Original value:', resultForm.data.value_boolean);
            } else {
                formData.append('value_boolean', ''); // Send empty string for boolean value
                formData.append('value_numeric', resultForm.data.value_numeric || ''); // Send numeric value or empty string
            }
            
            // Always create a new result record instead of updating
            // This ensures the latest result is always the most recent one
            
            // Use axios directly for better control
            axios.post(route('api.inspection-tasks.record-result', selectedTask.id), formData)
                .then((response) => {
                    console.log('Result submission successful:', response.data);
                    setIsResultDialogOpen(false);
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Result submission errors:', error.response?.data?.errors || error);
                    // You may want to handle these errors in the UI
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
                
                {/* Hero Header with Background */}
                <div className="relative bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] rounded-xl overflow-hidden shadow-lg">
                    <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
                    <div className="relative p-6 sm:p-8 text-white">
                        <div className="mb-4 flex justify-between items-start">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-full h-8 gap-1 bg-white/20 border-transparent hover:bg-white/30 text-white backdrop-blur-sm"
                            >
                                <Link href={route('inspections')}>
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back</span>
                                </Link>
                            </Button>
                            
                            <Button
                                onClick={openCreateTaskDialog}
                                className="rounded-full h-8 gap-1 bg-white/20 hover:bg-white/30 border-transparent text-white backdrop-blur-sm"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                <span>Add Task</span>
                            </Button>
                        </div>
                        
                        <div className="sm:flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                                    <ClipboardList className="h-8 w-8 text-white" />
                                </div>
                                
                                <div>
                                    <div className="mb-1">
                                        <h1 className="text-2xl sm:text-3xl font-bold">{inspection.name}</h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-white/30 hover:bg-white/40 text-white">
                                                ID: #{inspection.id}
                                            </Badge>
                                            
                                            <Badge className="bg-white/30 hover:bg-white/40 text-white">
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(inspection.status)}
                                                    {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                                                </span>
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    {inspection.description && (
                                        <p className="mt-3 text-white/90 max-w-2xl">{inspection.description}</p>
                                    )}
                                    
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                            <Clock className="h-4 w-4 mr-2" />
                                            <span>Created: {new Date(inspection.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                        
                                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                            <span>By: {inspection.creator?.name || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Summary Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Tasks</CardTitle>
                                <div className="rounded-md p-1 bg-gray-50">
                                    <ClipboardList className="h-4 w-4 text-gray-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{tasksCount}</div>
                                <div className="text-xs text-gray-500">total</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Completion</CardTitle>
                                <div className="rounded-md p-1 bg-gray-50">
                                    <BarChart3 className="h-4 w-4 text-gray-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{completionPercentage}%</div>
                                <div className="text-xs text-gray-500">
                                    {resultsCount} of {tasksCount} tasks
                                </div>
                            </div>
                            <Progress className="h-1 mt-2" value={completionPercentage} />
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Passed</CardTitle>
                                <div className="rounded-md p-1 bg-green-50">
                                    <CheckIcon className="h-4 w-4 text-green-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{passedCount}</div>
                                <div className="text-xs text-gray-500">
                                    {resultsCount > 0 ? Math.round((passedCount / resultsCount) * 100) : 0}% pass rate
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Failed</CardTitle>
                                <div className="rounded-md p-1 bg-red-50">
                                    <XIcon className="h-4 w-4 text-red-700" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{failedCount}</div>
                                <div className="text-xs text-gray-500">
                                    {resultsCount > 0 ? Math.round((failedCount / resultsCount) * 100) : 0}% fail rate
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Inspection Content Tabs */}
                <Tabs defaultValue="tasks" className="mt-2">
                    <TabsList>
                        <TabsTrigger value="tasks" className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" />
                            Tasks ({tasksCount})
                        </TabsTrigger>
                        <TabsTrigger value="results" className="flex items-center gap-1">
                            <FileSpreadsheet className="h-4 w-4" />
                            Results ({resultsCount})
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="tasks" className="mt-4">
                        {/* Tasks Section */}
                        <div className="grid gap-4">
                            {/* Tasks Filter + Actions Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                    Inspection Tasks
                                </h2>
                                
                                <Button 
                                    onClick={openCreateTaskDialog}
                                    className="sm:self-end bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Task
                                </Button>
                            </div>
                            
                            {inspection.tasks && inspection.tasks.length > 0 ? (
                                <div className="overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Result</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {inspection.tasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-gray-50">
                                                    {/* Task Name & Type */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center">
                                                                <span className="font-medium text-gray-900">{task.name}</span>
                                                            </div>
                                                            <div className="mt-1 flex items-center">
                                                                <Badge variant="outline" className="h-5 mr-2">
                                                                    {task.type === 'yes_no' ? 'Yes/No' : 'Numeric'}
                                                                </Badge>
                                                                {task.results && task.results.length > 0 && (
                                                                    <Badge className="bg-green-100 text-green-800 h-5">
                                                                        {task.results.length} {task.results.length === 1 ? 'result' : 'results'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Task Details */}
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-600 max-w-sm line-clamp-2">
                                                            {task.description || 'No description provided'}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                            {task.target_type && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium mr-1">Target:</span>
                                                                    <span className="capitalize">{task.target_type}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {task.type === 'yes_no' && task.expected_value_boolean !== null && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium mr-1">Expected:</span>
                                                                    <span>{task.expected_value_boolean ? 'Yes' : 'No'}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {task.type === 'numeric' && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium mr-1">Range:</span>
                                                                    <span>
                                                                        {task.expected_value_min} - {task.expected_value_max} 
                                                                        {task.unit_of_measure ? ` ${task.unit_of_measure}` : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Latest Result */}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {task.results && task.results.length > 0 ? (
                                                            <div className="text-sm">
                                                                <div className="flex items-center">
                                                                    {task.results[0].is_passing ? (
                                                                        <span className="flex items-center text-green-600">
                                                                            <CheckIcon className="h-4 w-4 mr-1" />
                                                                            <span className="font-medium">Pass</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="flex items-center text-red-600">
                                                                            <XIcon className="h-4 w-4 mr-1" />
                                                                            <span className="font-medium">Fail</span>
                                                                        </span>
                                                                    )}
                                                                    <span className="mx-2 text-gray-400">•</span>
                                                                    <span>
                                                                        {task.type === 'yes_no' 
                                                                            ? (task.results[0].value_boolean ? 'Yes' : 'No')
                                                                            : `${task.results[0].value_numeric} ${task.unit_of_measure || ''}`
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-500">
                                                                    {task.results[0].performer?.name || 'Unknown'} on {new Date(task.results[0].created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-500 italic">No results yet</span>
                                                        )}
                                                    </td>
                                                    
                                                    {/* Actions */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={() => openRecordResultDialog(task)}
                                                            >
                                                                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                                                Record
                                                            </Button>
                                                            
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => openEditTaskDialog(task)}
                                                            >
                                                                <span className="sr-only">Edit</span>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-500"
                                                                onClick={() => openDeleteTaskDialog(task)}
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
                                <div className="text-center p-8 border rounded-md bg-muted/10">
                                    <ClipboardList className="h-10 w-10 mx-auto text-gray-400" />
                                    <h3 className="mt-4 text-lg font-medium">No tasks yet</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Get started by adding your first inspection task.
                                    </p>
                                    <Button 
                                        onClick={openCreateTaskDialog} 
                                        className="mt-4 bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        Add Your First Task
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="results" className="mt-4">
                        {/* Results Section */}
                        <div className="grid gap-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                Inspection Results
                            </h2>
                            
                            {resultsCount > 0 ? (
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="p-4">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="pb-3 font-medium">Task</th>
                                                    <th className="pb-3 font-medium">Result</th>
                                                    <th className="pb-3 font-medium">Status</th>
                                                    <th className="pb-3 font-medium">Performed By</th>
                                                    <th className="pb-3 font-medium">Date</th>
                                                    <th className="pb-3 font-medium">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inspection.tasks?.flatMap(task => 
                                                    task.results?.map(result => (
                                                        <tr key={result.id} className="border-b hover:bg-gray-50">
                                                            <td className="py-3 pr-4">{task.name}</td>
                                                            <td className="py-3 pr-4">
                                                                {task.type === 'yes_no' 
                                                                    ? (result.value_boolean ? 'Yes' : 'No')
                                                                    : `${result.value_numeric} ${task.unit_of_measure || ''}`
                                                                }
                                                            </td>
                                                            <td className="py-3 pr-4">
                                                                {result.is_passing ? (
                                                                    <Badge className="bg-green-100 text-green-800">
                                                                        <CheckIcon className="h-3 w-3 mr-1" />
                                                                        Pass
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-red-100 text-red-800">
                                                                        <XIcon className="h-3 w-3 mr-1" />
                                                                        Fail
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="py-3 pr-4">{result.performer?.name || 'Unknown'}</td>
                                                            <td className="py-3 pr-4">{new Date(result.created_at).toLocaleDateString()}</td>
                                                            <td className="py-3 pr-4 max-w-xs truncate">{result.notes || '-'}</td>
                                                        </tr>
                                                    )) || []
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8 border rounded-md bg-muted/10">
                                    <FileSpreadsheet className="h-10 w-10 mx-auto text-gray-400" />
                                    <h3 className="mt-4 text-lg font-medium">No results yet</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Results will appear here once you start recording them for tasks.
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
                
                {/* Task Form Dialog */}
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {isEditTaskMode ? 'Edit Task' : 'Add New Task'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditTaskMode 
                                    ? 'Update the task details below.' 
                                    : 'Fill in the task details below to create a new task.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTaskSubmit}>
                            <div className="grid gap-4 py-4">
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
                                    
                                    {taskForm.data.target_type && taskForm.data.target_type !== 'none' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="target_id" className={taskForm.errors.target_id ? "text-red-500" : ""}>
                                                Select {taskForm.data.target_type === 'drive' ? 'Drive' : 'Part'}
                                            </Label>
                                            <Select
                                                value={taskForm.data.target_id}
                                                onValueChange={(value) => taskForm.setData('target_id', value)}
                                            >
                                                <SelectTrigger className={taskForm.errors.target_id ? "border-red-500" : ""}>
                                                    <SelectValue placeholder={`Select ${taskForm.data.target_type}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {taskForm.data.target_type === 'drive' ? (
                                                        drives.map((drive) => (
                                                            <SelectItem key={drive.id} value={drive.id.toString()}>
                                                                {drive.name} ({drive.drive_ref})
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        parts.map((part) => (
                                                            <SelectItem key={part.id} value={part.id.toString()}>
                                                                {part.name} ({part.part_ref})
                                                            </SelectItem>
                                                        ))
                                                    )}
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
                            <DialogFooter>
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
                            <div className="mt-4 border-t pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                        // For debugging only
                                        const formData = { ...taskForm.data };
                                        console.log('Debug form data:', formData);
                                        
                                        // Test with our debug endpoint
                                        fetch('/debug-inspection-task', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                            },
                                            body: JSON.stringify(formData)
                                        })
                                        .then(response => response.json())
                                        .then(data => {
                                            console.log('Debug response:', data);
                                            alert('Check browser console for debug info');
                                        })
                                        .catch(error => {
                                            console.error('Debug error:', error);
                                            alert('Error: ' + error.message);
                                        });
                                    }}
                                >
                                    Debug Form
                                </Button>
                            </div>
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