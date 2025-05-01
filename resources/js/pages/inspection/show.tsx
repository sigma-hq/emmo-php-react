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
import { PlusIcon, Pencil, Trash2, CheckCircle, ClipboardList, ArrowLeft, CheckIcon, XIcon, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        resultForm.setData({
            task_type: task.type,
            value_boolean: 'true',
            value_numeric: '',
            notes: '',
        });
        setSelectedTask(task);
        setIsResultDialogOpen(true);
    };
    
    const handleResultSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedTask) {
            resultForm.post(route('api.inspection-tasks.record-result', selectedTask.id), {
                onSuccess: () => {
                    setIsResultDialogOpen(false);
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
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Inspection: ${inspection.name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Success Notification */}
                {showSuccessNotification && (
                    <div className="fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out">
                        <div className="flex items-center gap-3 bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow-lg">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">{successMessage}</p>
                        </div>
                    </div>
                )}
                
                {/* Page Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('inspections')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Inspections
                            </Button>
                        </Link>
                        
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClasses(inspection.status)}`}>
                                {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{inspection.name}</h1>
                            {inspection.description && (
                                <p className="text-sm text-gray-500 mt-1">{inspection.description}</p>
                            )}
                        </div>
                        
                        <Button 
                            onClick={openCreateTaskDialog}
                            className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                        Created by {inspection.creator?.name || 'Unknown'} on {new Date(inspection.created_at).toLocaleDateString()}
                    </div>
                </div>
                
                {/* Tasks Section */}
                <div className="grid gap-6">
                    <h2 className="text-xl font-semibold">Inspection Tasks</h2>
                    
                    {inspection.tasks && inspection.tasks.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {inspection.tasks.map((task) => (
                                <Card key={task.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">{task.name}</CardTitle>
                                            <div className="flex gap-1">
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
                                        </div>
                                        <CardDescription>
                                            {task.description || 'No description'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="grid gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Type:</span>
                                                <span>{task.type === 'yes_no' ? 'Yes/No' : 'Numeric'}</span>
                                            </div>
                                            
                                            {task.target_type && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Applies to:</span>
                                                    <span className="capitalize">{task.target_type}</span>
                                                </div>
                                            )}
                                            
                                            {task.type === 'yes_no' && task.expected_value_boolean !== null && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Expected value:</span>
                                                    <span>{task.expected_value_boolean ? 'Yes' : 'No'}</span>
                                                </div>
                                            )}
                                            
                                            {task.type === 'numeric' && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Expected range:</span>
                                                    <span>
                                                        {task.expected_value_min} - {task.expected_value_max} 
                                                        {task.unit_of_measure ? ` ${task.unit_of_measure}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button 
                                            className="w-full bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                                            onClick={() => openRecordResultDialog(task)}
                                        >
                                            Record Result
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
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
                            <DialogTitle>Record Result</DialogTitle>
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