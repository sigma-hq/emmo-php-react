import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    PlusIcon, ClipboardCheck, ClipboardList,
    Target
} from 'lucide-react';
// Import types from the parent component file
import { InspectionTask as BaseInspectionTask, InspectionSubTask } from '../show';
import axios from 'axios';
import InspectionTasksTable from '@/components/inspections/InspectionTasksTable';
import InspectionsSubTasksList from '@/components/inspections/InspectionsSubTasksList';
import InspectionsSubTaskDialog from '@/components/inspections/InspectionsSubTaskDialog';
import EditSubTaskResultDialog from '@/components/inspections/EditSubTaskResultDialog';

// Extend the imported interface to add sub_tasks
interface InspectionTask extends BaseInspectionTask {
    sub_tasks?: InspectionSubTask[];
    target_drive_id?: number;
    target_drive_ref?: string;
    target_part_id?: number;
    target_part_ref?: string;
}

interface TasksTabProps {
    tasks: InspectionTask[];
    openCreateTaskDialog: () => void;
    openEditTaskDialog: (task: InspectionTask) => void;
    openDeleteTaskDialog: (task: InspectionTask) => void;
    openRecordResultDialog: (task: InspectionTask) => void;
    isAdmin?: boolean;
}

// Define the response type from the backend
interface ApiResponse {
    success: boolean;
    message: string;
    redirect?: string;
    errors?: Record<string, string>;
}

// Define the form structure type
interface SubTaskFormData {
    inspection_task_id: string;
    name: string;
    description: string;
    type: 'yes_no' | 'numeric' | 'none';
    expected_value_boolean: string;  // Using string type to match form input
    expected_value_min: string;
    expected_value_max: string;
    unit_of_measure: string;
}

export default function TasksTab({ 
    tasks, 
    openCreateTaskDialog, 
    openEditTaskDialog, 
    openDeleteTaskDialog, 
    openRecordResultDialog,
    isAdmin
}: TasksTabProps) {
    // Track which tasks have expanded sub-task sections
    const [expandedTaskIds, setExpandedTaskIds] = useState<number[]>([]);
    
    // For sub-task dialog
    const [isSubTaskDialogOpen, setIsSubTaskDialogOpen] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [editingSubTask, setEditingSubTask] = useState<InspectionSubTask | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // For edit result dialog
    const [isEditResultDialogOpen, setIsEditResultDialogOpen] = useState(false);
    const [editingResultSubTask, setEditingResultSubTask] = useState<InspectionSubTask | null>(null);
    
    // Add local state to maintain tasks with updated subtasks
    const [localTasks, setLocalTasks] = useState<InspectionTask[]>(tasks);
    
    // Update local tasks when the prop changes
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);
    
    // Debug: Log the tasks to see if they include subtasks
    console.log('Tasks received in TasksTab:', tasks);
    console.log('Tasks with subtasks (JSON):', JSON.stringify(tasks, null, 2));
    console.log('First task subtasks:', tasks[0]?.sub_tasks);
    
    const subTaskForm = useForm({
        inspection_task_id: '',
        name: '',
        description: '',
        type: 'none' as 'yes_no' | 'numeric' | 'none',
        expected_value_boolean: 'true',
        expected_value_min: '',
        expected_value_max: '',
        unit_of_measure: '',
    });
    
    // Toggle task expansion
    const toggleTaskExpanded = (taskId: number) => {
        setExpandedTaskIds(prev => 
            prev.includes(taskId) 
                ? prev.filter(id => id !== taskId) 
                : [...prev, taskId]
        );
    };
    
    // Open dialog to add a new sub-task
    const openAddSubTaskDialog = (taskId: number) => {
        setCurrentTaskId(taskId);
        setEditingSubTask(null);
        setFormError(null);
        subTaskForm.reset();
        subTaskForm.setData('inspection_task_id', taskId.toString());
        setIsSubTaskDialogOpen(true);
    };
    
    // Open dialog to edit an existing sub-task
    const openEditSubTaskDialog = (subTask: InspectionSubTask) => {
        // Check if this sub-task has recorded results
        if (subTask.recorded_value_boolean !== null || subTask.recorded_value_numeric !== null || subTask.status === 'completed') {
            // Open the edit result dialog instead
            setEditingResultSubTask(subTask);
            setIsEditResultDialogOpen(true);
        } else {
            // Open the regular edit dialog for sub-task configuration
            setCurrentTaskId(subTask.inspection_task_id);
            setEditingSubTask(subTask);
            setFormError(null);
            subTaskForm.reset();
            subTaskForm.setData({
                inspection_task_id: subTask.inspection_task_id.toString(),
                name: subTask.name,
                description: subTask.description || '',
                type: subTask.type || 'none',
                expected_value_boolean: subTask.expected_value_boolean !== null ? subTask.expected_value_boolean.toString() : 'true',
                expected_value_min: subTask.expected_value_min !== null ? subTask.expected_value_min.toString() : '',
                expected_value_max: subTask.expected_value_max !== null ? subTask.expected_value_max.toString() : '',
                unit_of_measure: subTask.unit_of_measure || '',
            });
            setIsSubTaskDialogOpen(true);
        }
    };
    
    // Handle sub-task form submission
    const handleSubTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); // Clear any previous errors
        setIsSubmitting(true);
        
        try {
            // Prepare data - create a copy we can modify with different types
            const formData = { ...subTaskForm.data };
            
            // Create request data object with proper types
            const requestData: Record<string, any> = {
                inspection_task_id: formData.inspection_task_id,
                name: formData.name,
                description: formData.description,
                type: formData.type,
                expected_value_min: formData.expected_value_min || null,
                expected_value_max: formData.expected_value_max || null,
                unit_of_measure: formData.unit_of_measure || null
            };
            
            // Add boolean value with proper type if this is a yes/no type
            if (formData.type === 'yes_no') {
                requestData.expected_value_boolean = formData.expected_value_boolean === 'true';
                    } else {
                requestData.expected_value_boolean = null;
            }
            
            // Create optimistic UI update
            if (editingSubTask) {
                // For edit mode, create updated subtask
                const updatedSubTask: InspectionSubTask = {
                    ...editingSubTask,
                    name: formData.name,
                    description: formData.description || null,
                    type: formData.type as 'yes_no' | 'numeric' | 'none',
                    expected_value_boolean: formData.type === 'yes_no' 
                        ? formData.expected_value_boolean === 'true' 
                        : null,
                    expected_value_min: formData.type === 'numeric' && formData.expected_value_min 
                        ? parseFloat(formData.expected_value_min) 
                        : null,
                    expected_value_max: formData.type === 'numeric' && formData.expected_value_max 
                        ? parseFloat(formData.expected_value_max) 
                        : null,
                    unit_of_measure: formData.unit_of_measure || null,
                };
                
                // Update local state for edited subtask
                setLocalTasks(prevTasks => {
                    return prevTasks.map(task => {
                        if (task.id === parseInt(formData.inspection_task_id) && task.sub_tasks) {
                            return {
                                ...task,
                                sub_tasks: task.sub_tasks.map(st => 
                                    st.id === updatedSubTask.id ? updatedSubTask : st
                                )
                            };
                        }
                        return task;
                    });
            });
        } else {
                // For create mode, create a temporary ID for optimistic update
                const tempId = -Date.now(); // Use negative timestamp as temporary ID
                const newSubTask: InspectionSubTask = {
                    id: tempId,
                    inspection_task_id: parseInt(formData.inspection_task_id),
                    name: formData.name,
                    description: formData.description || null,
                    type: formData.type as 'yes_no' | 'numeric' | 'none',
                    status: 'pending',
                    expected_value_boolean: formData.type === 'yes_no' 
                        ? formData.expected_value_boolean === 'true' 
                        : null,
                    expected_value_min: formData.type === 'numeric' && formData.expected_value_min 
                        ? parseFloat(formData.expected_value_min) 
                        : null,
                    expected_value_max: formData.type === 'numeric' && formData.expected_value_max 
                        ? parseFloat(formData.expected_value_max) 
                        : null,
                    unit_of_measure: formData.unit_of_measure || null,
                    recorded_value_boolean: null,
                    recorded_value_numeric: null,
                    compliance: 'pending_action',
                    completed_by: null,
                    completed_at: null,
                    sort_order: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                // Update local state with new subtask
                setLocalTasks(prevTasks => {
                    return prevTasks.map(task => {
                        if (task.id === parseInt(formData.inspection_task_id)) {
                            return {
                                ...task,
                                sub_tasks: [...(task.sub_tasks || []), newSubTask]
                            };
                        }
                        return task;
                    });
                });
            }
            
            // Set URL based on whether we're editing or creating
            const url = editingSubTask 
                ? route('api.inspection-sub-tasks.update', editingSubTask.id)
                : route('api.inspection-sub-tasks.store');
            
            // Use axios to make the request directly
            const method = editingSubTask ? 'put' : 'post';
            const response = await axios[method](url, requestData);
            
            // Close the dialog on success
                    setIsSubTaskDialogOpen(false);
            
            // If we're creating a new task, we need to update our local temporary ID with the real one
            if (!editingSubTask && response.data.data) {
                // Wait a short time to let the backend process the changes
                setTimeout(() => {
                    // Fetch the latest data to ensure we have the correct IDs and state
                    router.reload({ only: ['inspection'] });
                }, 100);
            }
        } catch (error: any) {
            console.error('Error submitting sub-task:', error);
            
            // Handle validation errors
            if (error.response && error.response.data && error.response.data.errors) {
                const errors = error.response.data.errors;
                    if (errors.name) {
                        setFormError(errors.name);
                    } else if (errors.error) {
                        setFormError(errors.error);
                    } else {
                    setFormError('An error occurred while saving the sub-task.');
                    }
        } else {
                setFormError('An unexpected error occurred. Please try again.');
            }
            
            // Revert optimistic update on error
            setLocalTasks(tasks);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Delete a sub-task
    const deleteSubTask = (subTaskId: number) => {
        if (!confirm('Are you sure you want to delete this sub-task?')) {
            return;
        }
        
        // Find the subtask and its containing task for optimistic UI update
        let taskIdToUpdate: number | null = null;
        
        // Update local state first by removing the subtask
        setLocalTasks(prevTasks => {
            return prevTasks.map(task => {
                if (task.sub_tasks?.some(st => st.id === subTaskId)) {
                    taskIdToUpdate = task.id;
                    return {
                        ...task,
                        sub_tasks: task.sub_tasks.filter(st => st.id !== subTaskId)
                    };
                }
                return task;
            });
        });
        
        router.delete(route('api.inspection-sub-tasks.destroy', subTaskId), {
            preserveState: true,
            preserveScroll: true,
            onError: (errors) => {
                console.error('Error deleting sub-task:', errors);
                alert('Failed to delete sub-task. Please try again.');
                
                // Revert optimistic update on error
                setLocalTasks(tasks);
            }
        });
    };
    
    // Toggle sub-task completion status
    const toggleSubTaskStatus = (subTask: InspectionSubTask) => {
        // Create a copy of the subTask with updated status for optimistic UI update
        const updatedSubTask: InspectionSubTask = { 
            ...subTask, 
            status: subTask.status === 'completed' ? 'pending' : 'completed',
            completed_at: subTask.status === 'completed' ? null : new Date().toISOString(),
        };
        
        // Update local state first for optimistic UI update
        setLocalTasks(prevTasks => {
            return prevTasks.map(task => {
                if (task.id === updatedSubTask.inspection_task_id && task.sub_tasks) {
                    return {
                        ...task,
                        sub_tasks: task.sub_tasks.map(st => 
                            st.id === updatedSubTask.id ? updatedSubTask : st
                        )
                    };
                }
                return task;
            });
        });
        
        // For subtasks with type 'none', just toggle status
        if (subTask.type === 'none') {
        router.patch(route('api.inspection-sub-tasks.toggle-status', subTask.id), {}, {
                preserveState: true,
                preserveScroll: true,
            onError: (errors) => {
                console.error('Error toggling sub-task status:', errors);
                alert('Failed to update sub-task status. Please try again.');
                    
                    // Revert optimistic update on error
                    setLocalTasks(tasks);
                }
            });
        } else if (subTask.type === 'yes_no') {
            // For yes/no subtasks, record a result directly (current toggle becomes "yes")
            const boolValue = subTask.status !== 'completed';
            
            // Further enhance the optimistic update for yes/no type
            const enhancedSubTask: InspectionSubTask = {
                ...updatedSubTask,
                recorded_value_boolean: boolValue,
                compliance: boolValue === updatedSubTask.expected_value_boolean ? 'passing' : 'failing'
            };
            
            // Update local state with enhanced data
            setLocalTasks(prevTasks => {
                return prevTasks.map(task => {
                    if (task.id === enhancedSubTask.inspection_task_id && task.sub_tasks) {
                        return {
                            ...task,
                            sub_tasks: task.sub_tasks.map(st => 
                                st.id === enhancedSubTask.id ? enhancedSubTask : st
                            )
                        };
                    }
                    return task;
                });
            });
            
            recordSubTaskResult(subTask, 'yes_no', boolValue, null);
        } else if (subTask.type === 'numeric') {
            // For numeric subtasks, open a dialog to enter the value
            openRecordSubTaskResultDialog(subTask);
        }
    };
    
    // For recording results on numeric subtasks
    const [isRecordingSubTask, setIsRecordingSubTask] = useState(false);
    const [selectedSubTask, setSelectedSubTask] = useState<InspectionSubTask | null>(null);
    const [numericValue, setNumericValue] = useState('');
    
    const openRecordSubTaskResultDialog = (subTask: InspectionSubTask) => {
        setSelectedSubTask(subTask);
        setNumericValue('');
        setIsRecordingSubTask(true);
    };
    
    const handleRecordSubTaskResult = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSubTask) return;
        
        if (selectedSubTask.type === 'numeric') {
            const value = parseFloat(numericValue);
            
            if (isNaN(value)) {
                alert('Please enter a valid number');
                return;
            }
            
            recordSubTaskResult(selectedSubTask, 'numeric', null, value);
        }
        
        setIsRecordingSubTask(false);
    };
    
    const recordSubTaskResult = (
        subTask: InspectionSubTask, 
        type: 'yes_no' | 'numeric', 
        boolValue: boolean | null, 
        numValue: number | null
    ) => {
        const data = {
            sub_task_type: type,
            value_boolean: boolValue,
            value_numeric: numValue,
            notes: ''
        };
        
        // For numeric values, create optimistic update when called from handleRecordSubTaskResult
        if (type === 'numeric' && numValue !== null && selectedSubTask) {
            const updatedSubTask: InspectionSubTask = {
                ...selectedSubTask,
                status: 'completed',
                recorded_value_numeric: numValue,
                completed_at: new Date().toISOString(),
                // Set compliance based on the value being in range
                compliance: 
                    (selectedSubTask.expected_value_min !== null && numValue < selectedSubTask.expected_value_min) ||
                    (selectedSubTask.expected_value_max !== null && numValue > selectedSubTask.expected_value_max)
                    ? 'failing' : 'passing'
            };
            
            // Update local state with optimistic result
            setLocalTasks(prevTasks => {
                return prevTasks.map(task => {
                    if (task.id === updatedSubTask.inspection_task_id && task.sub_tasks) {
                        return {
                            ...task,
                            sub_tasks: task.sub_tasks.map(st => 
                                st.id === updatedSubTask.id ? updatedSubTask : st
                            )
                        };
                    }
                    return task;
                });
            });
        }
        
        router.post(route('api.inspection-sub-tasks.record-result', subTask.id), data, {
            preserveState: true,
            preserveScroll: true,
            onError: (errors) => {
                console.error('Error recording subtask result:', errors);
                alert('Failed to record result. Please try again.');
                
                // Revert optimistic update on error
                setLocalTasks(tasks);
            }
        });
    };
    
    const getComplianceBadge = (compliance: InspectionSubTask['compliance']) => {
        switch (compliance) {
            case 'passing':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-green-50 text-green-700 border-green-200">Passing</Badge>;
            case 'failing':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-red-50 text-red-700 border-red-200">Failing</Badge>;
            case 'warning':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-red-100 text-red-800 border-red-300">Warning</Badge>; // User requested red for warning
            case 'pending_action':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-gray-100 text-gray-600 border-gray-300">Pending Action</Badge>;
            case 'pending_result':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-yellow-50 text-yellow-700 border-yellow-200">Pending Result</Badge>;
            case 'complete': // For type 'none' that is completed
                 return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
            case 'misconfigured':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-orange-50 text-orange-700 border-orange-200">Misconfigured</Badge>;
            default:
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal">Unknown</Badge>;
        }
    };
    
    return (
        <div className="grid gap-4 w-full max-w-full overflow-x-hidden">
            {/* Tasks Filter + Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                    Inspection Tasks
                </h2>
                
                {isAdmin && (
                    <Button 
                        onClick={openCreateTaskDialog}
                        className="sm:self-end bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Task
                    </Button>
                )}
            </div>
            
            {localTasks && localTasks.length > 0 ? (
                <InspectionTasksTable 
                    tasks={localTasks.filter(task => {
                        // Filter out tasks that have results (completed tasks)
                        return !task.results || task.results.length === 0;
                    })} 
                    toggleTaskExpanded={toggleTaskExpanded} 
                    expandedTaskIds={expandedTaskIds} 
                    openRecordResultDialog={openRecordResultDialog} 
                    openEditTaskDialog={openEditTaskDialog} 
                    openDeleteTaskDialog={openDeleteTaskDialog} 
                    openAddSubTaskDialog={openAddSubTaskDialog} 
                    toggleSubTaskStatus={toggleSubTaskStatus} 
                    getComplianceBadge={getComplianceBadge} 
                    openEditSubTaskDialog={openEditSubTaskDialog} 
                    deleteSubTask={deleteSubTask}
                    isAdmin={isAdmin}
                />
            ) : (
                <div className="text-center p-8 border rounded-md bg-gray-50/50">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-2">
                        <ClipboardList className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks yet</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                        {isAdmin 
                            ? 'Get started by adding your first inspection task to define what needs to be checked.'
                            : 'No inspection tasks have been assigned yet. Contact an administrator to set up tasks for this inspection.'
                        }
                    </p>
                    {isAdmin && (
                        <Button 
                            onClick={openCreateTaskDialog} 
                            className="mt-4 bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Your First Task
                        </Button>
                    )}
                </div>
            )}
            
            {/* Sub-Task Dialog */}
            <InspectionsSubTaskDialog 
                isSubTaskDialogOpen={isSubTaskDialogOpen} 
                setIsSubTaskDialogOpen={setIsSubTaskDialogOpen} 
                editingSubTask={editingSubTask} 
                handleSubTaskSubmit={handleSubTaskSubmit} 
                subTaskForm={subTaskForm} 
                formError={formError} 
                isSubmitting={isSubmitting}
            />
            
            {/* Edit Result Dialog */}
            <EditSubTaskResultDialog
                isOpen={isEditResultDialogOpen}
                setIsOpen={setIsEditResultDialogOpen}
                subTask={editingResultSubTask}
                onSuccess={() => {
                    // Refresh the page to show updated data
                    window.location.reload();
                }}
            />
            
            {/* Numeric Result Dialog for Subtasks */}
            <Dialog open={isRecordingSubTask} onOpenChange={setIsRecordingSubTask}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">Record Measurement</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleRecordSubTaskResult} className="space-y-5 py-2">
                        {selectedSubTask && selectedSubTask.type === 'numeric' && (
                            <>
                                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
                                    <h3 className="font-medium text-gray-900 mb-1">{selectedSubTask.name}</h3>
                                    {selectedSubTask.description && (
                                        <p className="text-sm text-gray-600 mb-2">{selectedSubTask.description}</p>
                                    )}
                                    <div className="inline-flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <Target className="h-4 w-4 text-gray-400" />
                                        <span>Expected range: <span className="font-medium">{selectedSubTask.expected_value_min} - {selectedSubTask.expected_value_max} 
                                                        {selectedSubTask.unit_of_measure && ` ${selectedSubTask.unit_of_measure}`}</span></span>
                                    </div>
                        </div>
                        
                                <div className="space-y-3">
                                    <Label htmlFor="numeric-value" className="text-base">Enter measurement value</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <Input 
                                                id="numeric-value"
                                                type="number"
                                                value={numericValue}
                                                onChange={e => setNumericValue(e.target.value)}
                                                placeholder={`Value between ${selectedSubTask.expected_value_min} - ${selectedSubTask.expected_value_max}`}
                                                step="any"
                                                required
                                                autoFocus
                                                className="text-lg h-12"
                                            />
                                        </div>
                                        {selectedSubTask.unit_of_measure && (
                                            <span className="text-gray-500 text-lg">{selectedSubTask.unit_of_measure}</span>
                            )}
                        </div>
                            </div>
                            </>
                        )}
                        
                        <DialogFooter className="mt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsRecordingSubTask(false)}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)] w-full sm:w-auto"
                            >
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Record Result
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
 