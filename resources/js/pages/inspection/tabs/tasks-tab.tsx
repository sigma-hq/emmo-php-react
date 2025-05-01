import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    PlusIcon,
    CheckIcon,
    XIcon,
    ClipboardCheck,
    Pencil,
    Trash2,
    ClipboardList
} from 'lucide-react';
// Import types from the parent component file
import { InspectionTask, InspectionResult } from '../show';

// Removed local interface definitions

interface TasksTabProps {
    tasks: InspectionTask[];
    openCreateTaskDialog: () => void;
    openEditTaskDialog: (task: InspectionTask) => void;
    openDeleteTaskDialog: (task: InspectionTask) => void;
    openRecordResultDialog: (task: InspectionTask) => void;
}

export default function TasksTab({ 
    tasks, 
    openCreateTaskDialog, 
    openEditTaskDialog, 
    openDeleteTaskDialog, 
    openRecordResultDialog 
}: TasksTabProps) {
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Result</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasks.map((task) => (
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
    );
}
