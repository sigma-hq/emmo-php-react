import { Badge } from '@/components/ui/badge';
import {
    CheckIcon,
    XIcon,
    FileSpreadsheet
} from 'lucide-react';
// Import types from the parent component file
import { Inspection, InspectionTask, InspectionResult } from '../show';

// Removed local interface definitions

interface ResultsTabProps {
    inspection: Inspection;
    resultsCount: number;
}

export default function ResultsTab({ inspection, resultsCount }: ResultsTabProps) {
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
                                    task.results?.map((result: InspectionResult) => (
                                        <tr key={result.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {task.name}
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