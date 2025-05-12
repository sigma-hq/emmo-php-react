import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useState } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    CheckIcon,
    XIcon,
    ClipboardCheck,
    Pencil,
    Trash2,
    ClipboardList,
    Target,
    FileText,
    AlertTriangle,
    CalendarClock,
    User,
    Check,
    Hash,
    ChevronDown,
    ChevronRight,
    ListChecks
} from 'lucide-react';
// Import types from the parent component file
import { InspectionTask as BaseInspectionTask, InspectionResult, InspectionSubTask } from '../show';
import { format } from 'date-fns';

// Extend the imported interface to add sub_tasks
interface InspectionTask extends BaseInspectionTask {
    sub_tasks?: InspectionSubTask[];
}

interface TasksTabProps {
    tasks: InspectionTask[];
    openCreateTaskDialog: () => void;
    openEditTaskDialog: (task: InspectionTask) => void;
    openDeleteTaskDialog: (task: InspectionTask) => void;
    openRecordResultDialog: (task: InspectionTask) => void;
}

// Define the response type from the backend
interface ApiResponse {
    success: boolean;
    message: string;
    redirect?: string;
    errors?: Record<string, string>;
}

export default function TasksTab({ 
    tasks, 
    openCreateTaskDialog, 
    openEditTaskDialog, 
    openDeleteTaskDialog, 
    openRecordResultDialog 
}: TasksTabProps) {
    // Track which tasks have expanded sub-task sections
    const [expandedTaskIds, setExpandedTaskIds] = useState<number[]>([]);
    
    // For sub-task dialog
    const [isSubTaskDialogOpen, setIsSubTaskDialogOpen] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [editingSubTask, setEditingSubTask] = useState<InspectionSubTask | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    
    // Debug: Log the tasks to see if they include subtasks
    console.log('Tasks received in TasksTab:', tasks);
    console.log('Tasks with subtasks (JSON):', JSON.stringify(tasks, null, 2));
    console.log('First task subtasks:', tasks[0]?.sub_tasks);
    
    const subTaskForm = useForm({
        inspection_task_id: '',
        name: '',
        description: '',
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
        setCurrentTaskId(subTask.inspection_task_id);
        setEditingSubTask(subTask);
        setFormError(null);
        subTaskForm.reset();
        subTaskForm.setData({
            inspection_task_id: subTask.inspection_task_id.toString(),
            name: subTask.name,
            description: subTask.description || '',
        });
        setIsSubTaskDialogOpen(true);
    };
    
    // Handle sub-task form submission
    const handleSubTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); // Clear any previous errors
        
        if (editingSubTask) {
            // Update existing sub-task using Inertia
            subTaskForm.put(route('api.inspection-sub-tasks.update', editingSubTask.id), {
                onSuccess: () => {
                    setIsSubTaskDialogOpen(false);
                    // Let the page reload naturally via redirect
                },
                onError: (errors) => {
                    console.error('Error updating sub-task:', errors);
                    // Set the error message to display in the dialog
                    if (errors.name) {
                        setFormError(errors.name);
                    } else if (errors.error) {
                        setFormError(errors.error);
                    } else {
                        setFormError('An error occurred while updating the sub-task.');
                    }
                    // Don't close the dialog when there's an error
                }
            });
        } else {
            // Create new sub-task using Inertia
            subTaskForm.post(route('api.inspection-sub-tasks.store'), {
                onSuccess: () => {
                    setIsSubTaskDialogOpen(false);
                    // Let the page reload naturally via redirect
                },
                onError: (errors) => {
                    console.error('Error creating sub-task:', errors);
                    // Set the error message to display in the dialog
                    if (errors.name) {
                        setFormError(errors.name);
                    } else if (errors.error) {
                        setFormError(errors.error);
                    } else {
                        setFormError('An error occurred while creating the sub-task.');
                    }
                    // Don't close the dialog when there's an error
                }
            });
        }
    };
    
    // Delete a sub-task
    const deleteSubTask = (subTaskId: number) => {
        if (!confirm('Are you sure you want to delete this sub-task?')) {
            return;
        }
        
        router.delete(route('api.inspection-sub-tasks.destroy', subTaskId), {
            onSuccess: () => {
                // Let the page reload naturally via redirect
            },
            onError: (errors) => {
                console.error('Error deleting sub-task:', errors);
                alert('Failed to delete sub-task. Please try again.');
            }
        });
    };
    
    // Toggle sub-task completion status
    const toggleSubTaskStatus = (subTask: InspectionSubTask) => {
        router.patch(route('api.inspection-sub-tasks.toggle-status', subTask.id), {}, {
            onSuccess: () => {
                // Let the page reload naturally via redirect
            },
            onError: (errors) => {
                console.error('Error toggling sub-task status:', errors);
                alert('Failed to update sub-task status. Please try again.');
            }
        });
    };
    
    return (
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
            
            {tasks && tasks.length > 0 ? (
                <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Result</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasks.map((task, index) => (
                                <React.Fragment key={task.id}>
                                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                                        {/* Task Number/Index */}
                                        <td className="px-3 py-4 text-center">
                                            <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                                                {index + 1}
                                            </div>
                                        </td>
                                    
                                    {/* Task Name & Type */}
                                        <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center">
                                                    <button 
                                                        className="mr-2 focus:outline-none"
                                                        onClick={() => toggleTaskExpanded(task.id)}
                                                    >
                                                        {expandedTaskIds.includes(task.id) ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-500" />
                                                        )}
                                                    </button>
                                                <span className="font-medium text-gray-900">{task.name}</span>
                                            </div>
                                                <div className="mt-1 flex items-center gap-2 ml-6">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`px-2 py-0.5 ${
                                                            task.type === 'yes_no' 
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                                : 'bg-purple-50 text-purple-700 border-purple-200'
                                                        }`}
                                                    >
                                                    {task.type === 'yes_no' ? 'Yes/No' : 'Numeric'}
                                                </Badge>
                                                    
                                                    {task.sub_tasks && task.sub_tasks.length > 0 && (
                                                        <Badge className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1">
                                                            <ListChecks className="h-3 w-3" />
                                                            <span>{task.sub_tasks.filter((st: InspectionSubTask) => st.status === 'completed').length}/{task.sub_tasks.length}</span>
                                                        </Badge>
                                                    )}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Task Details */}
                                    <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {task.description && (
                                                    <div className="flex items-start gap-1.5">
                                                        <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                        </div>
                                                )}
                                                
                                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            {task.target_type && (
                                                        <div className="flex items-center gap-1">
                                                            <Target className="h-3 w-3 text-gray-400" />
                                                            <span className="font-medium">Target:</span>
                                                    <span className="capitalize">{task.target_type}</span>
                                                </div>
                                            )}
                                            
                                            {task.type === 'yes_no' && task.expected_value_boolean !== null && (
                                                        <div className="flex items-center gap-1">
                                                            <Check className="h-3 w-3 text-gray-400" />
                                                            <span className="font-medium">Expected:</span>
                                                            <span className={`${task.expected_value_boolean ? 'text-green-600' : 'text-red-600'}`}>
                                                                {task.expected_value_boolean ? 'Yes' : 'No'}
                                                            </span>
                                                </div>
                                            )}
                                            
                                            {task.type === 'numeric' && (
                                                        <div className="flex items-center gap-1">
                                                            <Hash className="h-3 w-3 text-gray-400" />
                                                            <span className="font-medium">Range:</span>
                                                    <span>
                                                        {task.expected_value_min} - {task.expected_value_max} 
                                                                {task.unit_of_measure ? (
                                                                    <span className="text-gray-600">{task.unit_of_measure}</span>
                                                                ) : ''}
                                                    </span>
                                                </div>
                                            )}
                                                </div>
                                        </div>
                                    </td>
                                    
                                    {/* Latest Result */}
                                        <td className="px-6 py-4">
                                        {task.results && task.results.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                <div className="flex items-center">
                                                    {task.results[0].is_passing ? (
                                                            <Badge className="bg-green-100 border-green-200 text-green-800 flex items-center gap-1 h-6 px-2">
                                                                <CheckIcon className="h-3.5 w-3.5" />
                                                                <span>Pass</span>
                                                            </Badge>
                                                    ) : (
                                                            <Badge className="bg-red-100 border-red-200 text-red-800 flex items-center gap-1 h-6 px-2">
                                                                <XIcon className="h-3.5 w-3.5" />
                                                                <span>Fail</span>
                                                            </Badge>
                                                    )}
                                                    <span className="mx-2 text-gray-400">•</span>
                                                        <span className="font-medium">
                                                        {task.type === 'yes_no' 
                                                            ? (task.results[0].value_boolean ? 'Yes' : 'No')
                                                            : `${task.results[0].value_numeric} ${task.unit_of_measure || ''}`
                                                        }
                                                    </span>
                                                </div>
                                                    
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3 text-gray-400" />
                                                            <span>{task.results[0].performer?.name || 'Unknown'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <CalendarClock className="h-3 w-3 text-gray-400" />
                                                            <span>{format(new Date(task.results[0].created_at), 'MMM d, yyyy')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                    <span className="text-xs italic">No results recorded</span>
                                            </div>
                                            )}
                                        </td>
                                        
                                        {/* Status Column */}
                                        <td className="px-6 py-4">
                                            {task.results && task.results.length > 0 ? (
                                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-0.5">
                                                    Recorded
                                                </Badge>
                                        ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-500 px-2 py-0.5">
                                                    Pending
                                                </Badge>
                                        )}
                                    </td>
                                    
                                    {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                    className="h-8 bg-[var(--emmo-green-light)] border-[var(--emmo-green-primary)] text-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-light)]/80"
                                                onClick={() => openRecordResultDialog(task)}
                                            >
                                                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                                Record
                                            </Button>
                                            
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                                onClick={() => openEditTaskDialog(task)}
                                            >
                                                <span className="sr-only">Edit</span>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => openDeleteTaskDialog(task)}
                                            >
                                                <span className="sr-only">Delete</span>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                                    
                                    {/* Sub-tasks section (conditionally rendered) */}
                                    {expandedTaskIds.includes(task.id) && (
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={6} className="px-6 py-2">
                                                <div className="border-t border-gray-200 pt-3 pb-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-medium text-sm text-gray-700 flex items-center">
                                                            <ListChecks className="h-4 w-4 mr-1.5 text-gray-500" />
                                                            Sub-Tasks
                                                        </h4>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={() => openAddSubTaskDialog(task.id)}
                                                        >
                                                            <PlusIcon className="h-3 w-3 mr-1" />
                                                            Add Sub-Task
                                                        </Button>
                                                    </div>
                                                    
                                                    {task.sub_tasks && task.sub_tasks.length > 0 ? (
                                                        <ul className="space-y-2 mb-2">
                                                            {task.sub_tasks.map((subTask: InspectionSubTask) => (
                                                                <li key={subTask.id} className="flex items-start py-2 pl-2 pr-4 rounded-md hover:bg-gray-100 group">
                                                                    <div className="mr-3 pt-0.5">
                                                                        <Checkbox 
                                                                            checked={subTask.status === 'completed'}
                                                                            onCheckedChange={() => toggleSubTaskStatus(subTask)}
                                                                            className={subTask.status === 'completed' ? 'bg-[var(--emmo-green-primary)] border-[var(--emmo-green-primary)]' : ''}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex flex-col">
                                                                            <span className={`font-medium ${subTask.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                                                {subTask.name}
                                                                            </span>
                                                                            {subTask.description && (
                                                                                <p className={`text-sm mt-0.5 ${subTask.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                    {subTask.description}
                                                                                </p>
                                                                            )}
                                                                            {subTask.status === 'completed' && subTask.completedBy && (
                                                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                                                                    <User className="h-3 w-3 text-gray-400" />
                                                                                    <span>Completed by {subTask.completedBy.name}</span>
                                                                                    {subTask.completed_at && (
                                                                                        <>
                                                                                            <span className="text-gray-400">•</span>
                                                                                            <span>{format(new Date(subTask.completed_at), 'MMM d, h:mm a')}</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                                                                            onClick={() => openEditSubTaskDialog(subTask)}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                                                            onClick={() => deleteSubTask(subTask.id)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="text-center py-6">
                                                            <p className="text-sm text-gray-500">No sub-tasks yet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center p-8 border rounded-md bg-gray-50/50">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-2">
                        <ClipboardList className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks yet</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                        Get started by adding your first inspection task to define what needs to be checked.
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
            
            {/* Sub-Task Dialog */}
            <Dialog open={isSubTaskDialogOpen} onOpenChange={setIsSubTaskDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingSubTask ? 'Edit Sub-Task' : 'Add Sub-Task'}</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubTaskSubmit} className="space-y-4 py-2">
                        <input 
                            type="hidden" 
                            name="inspection_task_id" 
                            value={subTaskForm.data.inspection_task_id} 
                        />
                        
                        <div className="space-y-2">
                            <Label htmlFor="sub-task-name">Name</Label>
                            <Input 
                                id="sub-task-name"
                                name="name"
                                value={subTaskForm.data.name}
                                onChange={e => subTaskForm.setData('name', e.target.value)}
                                placeholder="Enter sub-task name"
                                required
                            />
                            {subTaskForm.errors.name && (
                                <p className="text-sm text-red-500">{subTaskForm.errors.name}</p>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="sub-task-description">Description (Optional)</Label>
                            <Textarea 
                                id="sub-task-description"
                                name="description"
                                value={subTaskForm.data.description}
                                onChange={e => subTaskForm.setData('description', e.target.value)}
                                placeholder="Enter sub-task description"
                                rows={3}
                            />
                            {subTaskForm.errors.description && (
                                <p className="text-sm text-red-500">{subTaskForm.errors.description}</p>
                            )}
                        </div>
                        
                        {formError && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                                {formError}
                            </div>
                        )}
                        
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsSubTaskDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={subTaskForm.processing}
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                            >
                                {editingSubTask ? 'Update Sub-Task' : 'Add Sub-Task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
 