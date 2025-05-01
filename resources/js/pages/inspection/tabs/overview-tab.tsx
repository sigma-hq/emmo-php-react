import { Inspection, InspectionTask } from '../show';
import Chart from 'react-apexcharts';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    BarChart3, 
    ClipboardList, 
    CheckIcon, 
    XIcon, 
    Info, 
    FileText, 
    PieChart, 
    CheckSquare as CheckSquareIcon, 
    CalendarDays,
    Repeat
} from 'lucide-react';
import { format } from 'date-fns';

// Helper function to format schedule frequency (can be moved to utils)
const formatFrequency = (freq: string | null | undefined, interval: number | null | undefined): string => {
    if (!freq || !interval) return 'Non-repeating';
    const intervalText = interval > 1 ? `Every ${interval}` : 'Every';
    switch (freq) {
        case 'daily': return `${intervalText} ${interval > 1 ? 'days' : 'day'}`;
        case 'weekly': return `${intervalText} ${interval > 1 ? 'weeks' : 'week'}`;
        case 'monthly': return `${intervalText} ${interval > 1 ? 'months' : 'month'}`;
        case 'yearly': return `${intervalText} ${interval > 1 ? 'years' : 'year'}`;
        default: return 'Invalid Schedule';
    }
};

interface OverviewTabProps {
    inspection: Inspection;
    tasksCount?: number;
    resultsCount?: number;
    passedCount?: number;
    failedCount?: number;
    completionPercentage?: number;
    getStatusBadgeClasses: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
}

export default function OverviewTab({ 
    inspection,
    tasksCount = 0,
    resultsCount = 0,
    passedCount = 0,
    failedCount = 0,
    completionPercentage = 0,
    getStatusBadgeClasses,
    getStatusIcon
}: OverviewTabProps) {
    if (inspection.is_template) {
        return (
            <div className="grid gap-6">
                <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                    <h2 className="text-xl font-semibold">Template Schedule</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                             <CalendarDays className="h-4 w-4 text-gray-600" />
                            Scheduling Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                            <div>
                                <dt className="font-medium text-gray-500 flex items-center gap-1.5">
                                    <Repeat className="h-3.5 w-3.5" /> Frequency
                                </dt>
                                <dd className="mt-1">
                                    {formatFrequency(inspection.schedule_frequency, inspection.schedule_interval)}
                                </dd>
                            </div>
                             <div>
                                <dt className="font-medium text-gray-500">Start Date</dt>
                                <dd className="mt-1">
                                    {inspection.schedule_start_date 
                                        ? format(new Date(inspection.schedule_start_date), "PPP") 
                                        : <span className="text-gray-400 italic">Not Set</span>}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500">End Date</dt>
                                <dd className="mt-1">
                                    {inspection.schedule_end_date 
                                        ? format(new Date(inspection.schedule_end_date), "PPP") 
                                        : <span className="text-gray-400 italic">No End Date</span>}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500">Next Due Date</dt>
                                <dd className="mt-1">
                                    {inspection.schedule_next_due_date 
                                        ? format(new Date(inspection.schedule_next_due_date), "PPP") 
                                        : <span className="text-gray-400 italic">Not Scheduled</span>}
                                </dd>
                            </div>
                             <div>
                                <dt className="font-medium text-gray-500">Last Instance Created</dt>
                                <dd className="mt-1">
                                    {inspection.schedule_last_created_at 
                                        ? format(new Date(inspection.schedule_last_created_at), "Pp") 
                                        : <span className="text-gray-400 italic">Never</span>}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>
        );
    } else {
        return (
            <div className="grid gap-6">
                <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                    <h2 className="text-xl font-semibold">Inspection Overview</h2>
                </div>
                
                {/* Stats Dashboard */}
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
                
                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <PieChart className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                Completion Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            {tasksCount > 0 ? (
                                <Chart
                                    options={{
                                        chart: { type: 'donut' },
                                        labels: ['Completed', 'Pending'],
                                        colors: ['#10B981', '#F3F4F6'], // Emerald 500, Gray 100
                                        legend: { show: false },
                                        dataLabels: { enabled: false },
                                        plotOptions: {
                                            pie: {
                                                donut: {
                                                    size: '75%',
                                                    labels: {
                                                        show: true,
                                                        total: {
                                                            show: true,
                                                            label: 'Completed',
                                                            formatter: () => `${completionPercentage}%`
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    series={[resultsCount, tasksCount - resultsCount]}
                                    type="donut"
                                    width="250"
                                />
                            ) : (
                                <div className="text-center py-8 text-gray-500">No tasks</div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <CheckSquareIcon className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                Result Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            {resultsCount > 0 ? (
                                <Chart
                                    options={{
                                        chart: { type: 'donut' },
                                        labels: ['Passed', 'Failed'],
                                        colors: ['#10B981', '#EF4444'], // Emerald 500, Red 500
                                        legend: { position: 'bottom' },
                                        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(1)}%` }
                                    }}
                                    series={[passedCount, failedCount]}
                                    type="donut"
                                    width="250"
                                />
                            ) : (
                                <div className="text-center py-8 text-gray-500">No results yet</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }
} 