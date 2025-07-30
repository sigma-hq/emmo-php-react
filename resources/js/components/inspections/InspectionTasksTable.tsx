import { InspectionTask as BaseInspectionTask, InspectionSubTask } from '@/pages/inspection/show';
import React from "react";
import { ChevronDown, ChevronRight, ClipboardCheck, Pencil, Trash2, AlertTriangle, Check, CalendarClock, User, Hash, ListChecks, PlusIcon, Target, CheckIcon, XIcon, Wrench } from "lucide-react";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { JSX } from 'react';

interface InspectionTask extends BaseInspectionTask {
    sub_tasks?: InspectionSubTask[];
    target_drive_id?: number;
    target_drive_ref?: string;
    target_part_id?: number;
    target_part_ref?: string;
}

export default function InspectionTasksTable({ 
    tasks, 
    toggleTaskExpanded, 
    expandedTaskIds, 
    openRecordResultDialog, 
    openEditTaskDialog, 
    openDeleteTaskDialog, 
    openAddSubTaskDialog, 
    toggleSubTaskStatus, 
    getComplianceBadge, 
    openEditSubTaskDialog, 
    deleteSubTask,
    isAdmin
}: {
    tasks: InspectionTask[];
    toggleTaskExpanded: (taskId: number) => void;
    expandedTaskIds: number[];
    openRecordResultDialog: (task: InspectionTask) => void;
    openEditTaskDialog: (task: InspectionTask) => void;
    openDeleteTaskDialog: (task: InspectionTask) => void;
    openAddSubTaskDialog: (taskId: number) => void;
    toggleSubTaskStatus: (subTask: InspectionSubTask) => void;
    getComplianceBadge: (compliance: InspectionSubTask["compliance"]) => JSX.Element;
    openEditSubTaskDialog: (subTask: InspectionSubTask) => void;
    deleteSubTask: (subTaskId: number) => void;
    isAdmin?: boolean;
}): React.ReactNode {
    return <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
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
                                            className={`px-2 py-0.5 ${task.type === 'yes_no'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-purple-50 text-purple-700 border-purple-200'}`}
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

                                        {task.target_type === 'drive' && task.target_drive_ref && (
                                            <div className="flex items-center gap-1">
                                                <Hash className="h-3 w-3 text-gray-400" />
                                                <span className="font-medium">Drive:</span>
                                                <span className="text-blue-600">{task.target_drive_ref}</span>
                                            </div>
                                        )}

                                        {task.target_type === 'part' && task.target_part_ref && (
                                            <div className="flex items-center gap-1">
                                                <Hash className="h-3 w-3 text-gray-400" />
                                                <span className="font-medium">Part:</span>
                                                <span className="text-blue-600">{task.target_part_ref}</span>
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
                                                    : `${task.results[0].value_numeric} ${task.unit_of_measure || ''}`}
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
                                    {/* Check if task has pending subtasks */}
                                    {task.sub_tasks && task.sub_tasks.length > 0 ? (
                                        <div className="relative group">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`h-8 ${
                                                    task.sub_tasks?.some(st => st.status !== 'completed')
                                                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                                        : 'bg-[var(--emmo-green-light)] border-[var(--emmo-green-primary)] text-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-light)]/80'
                                                }`}
                                                onClick={() => {
                                                    if (!task.sub_tasks?.some(st => st.status !== 'completed')) {
                                                        openRecordResultDialog(task);
                                                    }
                                                }}
                                                disabled={task.sub_tasks?.some(st => st.status !== 'completed')}
                                            >
                                                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                                Record
                                            </Button>
                                            
                                            {task.sub_tasks?.some(st => st.status !== 'completed') && (
                                                <div className="absolute bottom-full mb-2 -left-2 w-48 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                    Complete all subtasks before recording results
                                                    <div className="absolute top-full left-6 h-2 w-2 bg-gray-800 transform rotate-45 -mt-1"></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 bg-[var(--emmo-green-light)] border-[var(--emmo-green-primary)] text-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-light)]/80"
                                        onClick={() => openRecordResultDialog(task)}
                                    >
                                        <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                        Record
                                    </Button>
                                    )}

                                    {isAdmin && (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>

                        {/* Sub-tasks section (conditionally rendered) */}
                        {expandedTaskIds.includes(task.id) && (
                            <tr className="bg-gray-50/50">
                                <td colSpan={6} className="px-6 py-2">
                                    <div className="border-t border-gray-200 pt-3 pb-1">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium text-sm text-gray-700 flex items-center">
                                                <ListChecks className="h-4 w-4 mr-1.5 text-gray-500" />
                                                Sub-Tasks
                                            </h4>
                                            {isAdmin && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                                                    onClick={() => openAddSubTaskDialog(task.id)}
                                                >
                                                    <PlusIcon className="h-3 w-3 mr-1" />
                                                    Add Sub-Task
                                                </Button>
                                            )}
                                        </div>

                                        {task.sub_tasks && task.sub_tasks.length > 0 ? (
                                            <div className="space-y-2.5 mb-3 relative">
                                                {/* Progress line */}
                                                <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200"></div>

                                                {task.sub_tasks.map((subTask: InspectionSubTask) => (
                                                    <div
                                                        key={subTask.id}
                                                        className={`flex items-start p-3 rounded-lg border transition-all duration-200 ${subTask.status === 'completed'
                                                                ? 'bg-green-50/60 border-green-200'
                                                                : subTask.compliance === 'failing' || subTask.compliance === 'warning'
                                                                    ? 'bg-red-50/50 border-red-200'
                                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                                                    >
                                                        <div className="mr-3 relative z-10">
                                                            <div
                                                                className={`flex items-center justify-center h-7 w-7 rounded-full border transition-all duration-200 ${subTask.status === 'completed'
                                                                        ? 'bg-[var(--emmo-green-primary)] border-[var(--emmo-green-primary)] text-white'
                                                                        : subTask.compliance === 'failing' || subTask.compliance === 'warning'
                                                                            ? 'bg-red-100 border-red-300 text-red-600'
                                                                            : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'}`}
                                                                onClick={() => {
                                                                    // Only allow toggle if not already recorded
                                                                    if (subTask.recorded_value_boolean === null &&
                                                                        subTask.recorded_value_numeric === null) {
                                                                        toggleSubTaskStatus(subTask);
                                                                    }
                                                                } }
                                                                role="checkbox"
                                                                aria-checked={subTask.status === 'completed'}
                                                                tabIndex={subTask.recorded_value_boolean === null &&
                                                                    subTask.recorded_value_numeric === null ? 0 : -1}
                                                                aria-disabled={subTask.recorded_value_boolean !== null ||
                                                                    subTask.recorded_value_numeric !== null}
                                                                onKeyDown={(e) => {
                                                                    if ((e.key === 'Enter' || e.key === ' ') &&
                                                                        subTask.recorded_value_boolean === null &&
                                                                        subTask.recorded_value_numeric === null) {
                                                                        e.preventDefault();
                                                                        toggleSubTaskStatus(subTask);
                                                                    }
                                                                } }
                                                                style={{
                                                                    cursor: (subTask.recorded_value_boolean !== null ||
                                                                        subTask.recorded_value_numeric !== null)
                                                                        ? 'default' : 'pointer'
                                                                }}
                                                            >
                                                                {subTask.status === 'completed' ||
                                                                    subTask.recorded_value_boolean !== null ||
                                                                    subTask.recorded_value_numeric !== null ? (
                                                                    <CheckIcon className="h-4 w-4" />
                                                                ) : subTask.compliance === 'failing' || subTask.compliance === 'warning' ? (
                                                                    <AlertTriangle className="h-4 w-4" />
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h5 className={`font-medium ${subTask.status === 'completed'
                                                                            ? 'text-gray-600'
                                                                            : subTask.compliance === 'failing' || subTask.compliance === 'warning'
                                                                                ? 'text-red-700'
                                                                                : 'text-gray-800'}`}>
                                                                        {subTask.name}
                                                                    </h5>
                                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                        {getComplianceBadge(subTask.compliance)}

                                                                        {/* Maintenance indicator for failed sub-tasks */}
                                                                        {(subTask.compliance === 'failing' || subTask.compliance === 'warning') && (
                                                                            <Badge variant="outline" className="text-xs py-0.5 px-2 font-normal bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
                                                                                <Wrench className="h-3 w-3" />
                                                                                Maintenance
                                                                            </Badge>
                                                                        )}

                                                                        {subTask.type !== 'none' && (
                                                                            <Badge variant="outline" className={`text-xs py-0.5 px-2 font-normal ${subTask.type === 'yes_no'
                                                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                                    : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                                                                {subTask.type === 'yes_no' ? 'Yes/No' : 'Numeric'}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {subTask.description && (
                                                                    <p className={`text-sm mt-1 ${subTask.status === 'completed'
                                                                            ? 'text-gray-500'
                                                                            : subTask.compliance === 'failing' || subTask.compliance === 'warning'
                                                                                ? 'text-red-600'
                                                                                : 'text-gray-600'}`}>
                                                                        {subTask.description}
                                                                    </p>
                                                                )}

                                                                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                                                                    {/* Expected values */}
                                                                    {subTask.type === 'yes_no' && (
                                                                        <div className="flex items-center gap-1 text-gray-600">
                                                                            <Target className="h-3.5 w-3.5 text-gray-400" />
                                                                            <span>Expected: </span>
                                                                            <span className="font-medium">
                                                                                {subTask.expected_value_boolean === null ? 'N/A' : (subTask.expected_value_boolean ? 'Yes' : 'No')}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {subTask.type === 'numeric' && (
                                                                        <div className="flex items-center gap-1 text-gray-600">
                                                                            <Target className="h-3.5 w-3.5 text-gray-400" />
                                                                            <span>Range: </span>
                                                                            <span className="font-medium">
                                                                                {subTask.expected_value_min ?? 'N/A'} - {subTask.expected_value_max ?? 'N/A'} {subTask.unit_of_measure || ''}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Recorded values with visual indicators for out-of-range */}
                                                                    {subTask.type === 'yes_no' && subTask.recorded_value_boolean !== null && (
                                                                        <div className="flex items-center gap-1">
                                                                            <ClipboardCheck className="h-3.5 w-3.5 text-gray-400" />
                                                                            <span className="text-gray-600">Recorded: </span>
                                                                            <span className={`font-medium ${subTask.compliance === 'passing'
                                                                                    ? 'text-green-600'
                                                                                    : 'text-red-600 font-semibold'}`}>
                                                                                {subTask.recorded_value_boolean ? 'Yes' : 'No'}
                                                                                {subTask.compliance !== 'passing' && (
                                                                                    <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
                                                                                        Mismatch
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {subTask.type === 'numeric' && subTask.recorded_value_numeric !== null && (
                                                                        <div className="flex items-center gap-1">
                                                                            <ClipboardCheck className="h-3.5 w-3.5 text-gray-400" />
                                                                            <span className="text-gray-600">Recorded: </span>
                                                                            <span className={`font-medium ${subTask.compliance === 'passing'
                                                                                    ? 'text-green-600'
                                                                                    : 'text-red-600 font-semibold'}`}>
                                                                                {subTask.recorded_value_numeric} {subTask.unit_of_measure || ''}
                                                                                {subTask.compliance !== 'passing' && (
                                                                                    <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
                                                                                        Out of range
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Completion info */}
                                                                    {subTask.status === 'completed' && subTask.completedBy && (
                                                                        <div className="flex items-center gap-1 text-gray-500">
                                                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                                                            <span>{subTask.completedBy.name}</span>
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
                                                        <div className="flex items-center ml-2">
                                                            <div className="flex opacity-70 hover:opacity-100">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`h-8 w-8 p-0 rounded-full ${subTask.recorded_value_boolean !== null ||
                                                                            subTask.recorded_value_numeric !== null
                                                                            ? 'text-gray-300 cursor-not-allowed'
                                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                                                    onClick={() => {
                                                                        if (subTask.recorded_value_boolean === null &&
                                                                            subTask.recorded_value_numeric === null) {
                                                                            openEditSubTaskDialog(subTask);
                                                                        }
                                                                    } }
                                                                    disabled={subTask.recorded_value_boolean !== null ||
                                                                        subTask.recorded_value_numeric !== null}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`h-8 w-8 p-0 rounded-full ${subTask.recorded_value_boolean !== null ||
                                                                            subTask.recorded_value_numeric !== null
                                                                            ? 'text-red-200 cursor-not-allowed'
                                                                            : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                                                                    onClick={() => {
                                                                        if (subTask.recorded_value_boolean === null &&
                                                                            subTask.recorded_value_numeric === null) {
                                                                            deleteSubTask(subTask.id);
                                                                        }
                                                                    } }
                                                                    disabled={subTask.recorded_value_boolean !== null ||
                                                                        subTask.recorded_value_numeric !== null}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 mb-2 bg-gray-50/70 rounded-lg border border-dashed border-gray-300">
                                                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white border border-gray-200 mb-2">
                                                    <ListChecks className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">No sub-tasks available</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {isAdmin 
                                                        ? 'Add sub-tasks to break this task into smaller steps'
                                                        : 'No sub-tasks have been configured for this task'
                                                    }
                                                </p>
                                                {isAdmin && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-3 h-8 text-xs bg-white"
                                                        onClick={() => openAddSubTaskDialog(task.id)}
                                                    >
                                                        <PlusIcon className="h-3 w-3 mr-1" />
                                                        Add First Sub-Task
                                                    </Button>
                                                )}
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
    </div>;
}
 