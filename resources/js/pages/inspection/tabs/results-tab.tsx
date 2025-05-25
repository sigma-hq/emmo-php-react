import { Badge } from '@/components/ui/badge';
import {
    CheckIcon,
    XIcon,
    FileSpreadsheet,
    ChevronDown,
    ChevronRight,
    Target,
    Hash,
    ClipboardCheck,
    ListChecks
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
// Import types from the parent component file
import { Inspection, InspectionTask, InspectionResult, InspectionSubTask } from '../show';
import { format } from 'date-fns';

// Removed local interface definitions

interface ResultsTabProps {
    inspection: Inspection;
    resultsCount: number;
}

export default function ResultsTab({ inspection, resultsCount }: ResultsTabProps) {
    // Track which tasks are expanded to show subtasks
    const [expandedTaskIds, setExpandedTaskIds] = useState<number[]>([]);
    
    // Debug logging to inspect the data structure
    useEffect(() => {
        console.log("Inspections Data:", inspection);
        console.log("Tasks:", inspection.tasks);
        
        // Inspect all task properties including relationships
        if (inspection.tasks && inspection.tasks.length > 0) {
            const firstTask = inspection.tasks[0];
            console.log("First Task Keys:", Object.keys(firstTask));
            console.log("First Task SubTasks:", firstTask.subTasks);
        }
    }, [inspection]);
    
    // Toggle task expansion
    const toggleTaskExpanded = (taskId: number) => {
        setExpandedTaskIds(prev => 
            prev.includes(taskId) 
                ? prev.filter(id => id !== taskId) 
                : [...prev, taskId]
        );
    };
    
    // Helper to check if a task has subtasks
    const hasSubTasks = (task: InspectionTask) => {
        // Check both possible property names that might come from the API
        const subTasksArray = task.subTasks || task.sub_tasks;
        const hasSubTasksArray = subTasksArray && subTasksArray.length > 0;
        console.log(`Task ${task.id} (${task.name}) subtasks:`, subTasksArray, hasSubTasksArray ? "Has subtasks" : "No subtasks");
        return hasSubTasksArray;
    };
    
    // Debug info to console to help diagnose issues
    console.log("All tasks:", inspection.tasks?.map(t => ({ id: t.id, name: t.name, subTasks: t.subTasks })));
    
    // Helper function to get compliance badge
    const getComplianceBadge = (compliance: string) => {
        switch (compliance) {
            case 'passing':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-green-50 text-green-700 border-green-200">Passing</Badge>;
            case 'failing':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-red-50 text-red-700 border-red-200">Failing</Badge>;
            case 'warning':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-red-100 text-red-800 border-red-300">Warning</Badge>; 
            case 'pending_action':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-gray-100 text-gray-600 border-gray-300">Pending Action</Badge>;
            case 'pending_result':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-yellow-50 text-yellow-700 border-yellow-200">Pending Result</Badge>;
            case 'complete': 
                 return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
            case 'misconfigured':
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal bg-orange-50 text-orange-700 border-orange-200">Misconfigured</Badge>;
            default:
                return <Badge variant="outline" className="text-xs py-0 px-2 font-normal">Unknown</Badge>;
        }
    };
    
    return (
        <div className="grid gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                Inspection Results
            </h2>
            
            {resultsCount > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Performed By</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inspection.tasks?.flatMap((task: InspectionTask) =>
                                    task.results?.map((result: InspectionResult, index: number) => (
                                        <React.Fragment key={result.id}>
                                            <tr 
                                                className={`hover:bg-gray-50 cursor-pointer ${hasSubTasks(task) ? 'group' : ''}`}
                                                onClick={() => hasSubTasks(task) ? toggleTaskExpanded(task.id) : null}
                                            >
                                                <td className="pl-4 py-4 whitespace-nowrap text-sm">
                                                    {hasSubTasks(task) ? (
                                                        expandedTaskIds.includes(task.id) ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                                                        )
                                                    ) : null}
                                                </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex flex-col">
                                                        <span>{task.name}</span>
                                                        {hasSubTasks(task) && (
                                                            <span className="text-xs text-gray-500 flex items-center mt-1">
                                                                <ListChecks className="h-3.5 w-3.5 mr-1" />
                                                                {(task.subTasks || task.sub_tasks)?.filter(st => st.status === 'completed').length}/
                                                                {(task.subTasks || task.sub_tasks)?.length} subtasks
                                                            </span>
                                                        )}
                                                    </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {task.type === 'yes_no' 
                                                    ? (result.value_boolean ? 'Yes' : 'No')
                                                    : `${result.value_numeric} ${task.unit_of_measure || ''}`
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {result.is_passing ? (
                                                    <Badge className="bg-green-100 text-green-800 h-6 px-2.5">
                                                        <CheckIcon className="h-3.5 w-3.5 mr-1" />
                                                        Pass
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-800 h-6 px-2.5">
                                                        <XIcon className="h-3.5 w-3.5 mr-1" />
                                                        Fail
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                                <div className="flex items-center">
                                                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-2">
                                                        {(result.performer?.name || 'U').charAt(0)}
                                                    </div>
                                                    <span>{result.performer?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                                                <div className="flex flex-col">
                                                    <span>{new Date(result.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(result.created_at).toLocaleTimeString(undefined, {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                                <p className="truncate" title={result.notes || '-'}>
                                                    {result.notes || <span className="italic text-gray-400">No notes</span>}
                                                </p>
                                            </td>
                                        </tr>
                                            
                                            {/* Subtask panel - shown when task is expanded */}
                                            {expandedTaskIds.includes(task.id) && hasSubTasks(task) && (
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan={7} className="px-6 py-2">
                                                        <div className="border-t border-gray-200 pt-3 pb-1">
                                                            <h4 className="font-medium text-sm text-gray-700 flex items-center mb-3">
                                                                <ListChecks className="h-4 w-4 mr-1.5 text-gray-500" />
                                                                Subtasks Results
                                                            </h4>
                                                            
                                                            <div className="space-y-2 mb-3">
                                                                {(task.subTasks || task.sub_tasks)?.map((subTask: InspectionSubTask) => (
                                                                    <div 
                                                                        key={subTask.id}
                                                                        className={`flex items-start p-3 rounded-lg border ${
                                                                            subTask.status === 'completed' 
                                                                                ? subTask.compliance === 'passing' || subTask.compliance === 'complete'
                                                                                    ? 'bg-green-50/60 border-green-200'
                                                                                    : 'bg-red-50/50 border-red-200'
                                                                                : 'bg-white border-gray-200'
                                                                        }`}
                                                                    >
                                                                        <div className="mr-3">
                                                                            <div className={`flex items-center justify-center h-7 w-7 rounded-full ${
                                                                                subTask.status === 'completed'
                                                                                    ? subTask.compliance === 'passing' || subTask.compliance === 'complete'
                                                                                        ? 'bg-[var(--emmo-green-primary)] text-white'
                                                                                        : 'bg-red-500 text-white'
                                                                                    : 'bg-gray-200 text-gray-500'
                                                                            }`}>
                                                                                {subTask.status === 'completed' ? (
                                                                                    <CheckIcon className="h-4 w-4" />
                                                                                ) : (
                                                                                    subTask.sort_order + 1
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex flex-col">
                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <h5 className="font-medium text-gray-800">
                                                                                        {subTask.name}
                                                                                    </h5>
                                                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                                        {getComplianceBadge(subTask.compliance)}
                                                                                        
                                                                                        {subTask.type !== 'none' && (
                                                                                            <Badge variant="outline" className={`text-xs py-0.5 px-2 font-normal ${
                                                                                                subTask.type === 'yes_no'
                                                                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                                                                            }`}>
                                                                                                {subTask.type === 'yes_no' ? 'Yes/No' : 'Numeric'}
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                {subTask.description && (
                                                                                    <p className="text-sm mt-1 text-gray-600">
                                                                                        {subTask.description}
                                                                                    </p>
                                                                                )}
                                                                                
                                                                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                                                                                    {/* Expected values */}
                                                                                    {subTask.type === 'yes_no' && subTask.expected_value_boolean !== null && (
                                                                                        <div className="flex items-center gap-1 text-gray-600">
                                                                                            <Target className="h-3.5 w-3.5 text-gray-400" />
                                                                                            <span>Expected: </span>
                                                                                            <span className="font-medium">
                                                                                                {subTask.expected_value_boolean ? 'Yes' : 'No'}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {subTask.type === 'numeric' && (subTask.expected_value_min !== null || subTask.expected_value_max !== null) && (
                                                                                        <div className="flex items-center gap-1 text-gray-600">
                                                                                            <Target className="h-3.5 w-3.5 text-gray-400" />
                                                                                            <span>Range: </span>
                                                                                            <span className="font-medium">
                                                                                                {subTask.expected_value_min ?? 'Any'} - {subTask.expected_value_max ?? 'Any'} {subTask.unit_of_measure || ''}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {/* Recorded values */}
                                                                                    {subTask.type === 'yes_no' && subTask.recorded_value_boolean !== null && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            <ClipboardCheck className="h-3.5 w-3.5 text-gray-400" />
                                                                                            <span className="text-gray-600">Recorded: </span>
                                                                                            <span className={`font-medium ${
                                                                                                subTask.compliance === 'passing'
                                                                                                    ? 'text-green-600'
                                                                                                    : 'text-red-600'
                                                                                            }`}>
                                                                                                {subTask.recorded_value_boolean ? 'Yes' : 'No'}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {subTask.type === 'numeric' && subTask.recorded_value_numeric !== null && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            <ClipboardCheck className="h-3.5 w-3.5 text-gray-400" />
                                                                                            <span className="text-gray-600">Recorded: </span>
                                                                                            <span className={`font-medium ${
                                                                                                subTask.compliance === 'passing'
                                                                                                    ? 'text-green-600'
                                                                                                    : 'text-red-600'
                                                                                            }`}>
                                                                                                {subTask.recorded_value_numeric} {subTask.unit_of_measure || ''}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {/* Timestamp */}
                                                                                    {subTask.status === 'completed' && subTask.completedBy && (
                                                                                        <div className="flex items-center gap-1 text-gray-500 ml-auto">
                                                                                            <span>By {subTask.completedBy.name}</span>
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
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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
    );
} 