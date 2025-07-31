import { Inspection, InspectionTask, InspectionResult } from '../show';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    RadialBarChart, RadialBar, LabelList
} from 'recharts';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription,
    CardFooter
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
    PieChart as PieChartIcon, 
    CheckSquare as CheckSquareIcon, 
    CalendarDays,
    Repeat,
    Clock,
    User,
    Calendar,
    Target,
    History,
    ArrowUpCircle,
    BarChart as BarChartIcon,
    AlertTriangle,
    ClipboardCheck,
    Timer,
    Wrench,
    FileBarChart,
    ShieldCheck,
    CheckCircle,
    AlertCircle,
    FileSpreadsheet
} from 'lucide-react';
import { format, formatDistance, parseISO, differenceInDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

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

// Function to determine health status based on pass/fail rate
const getHealthStatus = (passRate: number): {
    label: string;
    color: string;
    icon: React.ReactNode;
} => {
    if (passRate >= 90) return { 
        label: 'Excellent', 
        color: 'text-green-600',
        icon: <ShieldCheck className="h-4 w-4 text-green-600" />
    };
    if (passRate >= 75) return { 
        label: 'Good', 
        color: 'text-emerald-600',
        icon: <CheckSquareIcon className="h-4 w-4 text-emerald-600" /> 
    };
    if (passRate >= 50) return { 
        label: 'Fair', 
        color: 'text-amber-600',
        icon: <AlertTriangle className="h-4 w-4 text-amber-600" />
    };
    return { 
        label: 'Poor', 
        color: 'text-red-600',
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />
    };
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

// Define chart colors
const CHART_COLORS = {
    green: '#059669',
    red: '#DC2626',
    gray: '#E5E7EB',
    blue: '#3B82F6',
    amber: '#D97706',
    purple: '#8B5CF6'
};

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
    // Calculate additional metrics
    const passRate = resultsCount > 0 ? Math.round((passedCount / resultsCount) * 100) : 0;
    const healthStatus = getHealthStatus(passRate);
    
    // Count subtasks
    const subTasksCount = inspection.tasks?.reduce((acc, task) => {
        return acc + ((task.subTasks?.length || 0) + (task.sub_tasks?.length || 0));
    }, 0) || 0;
    
    // Count tasks by type for charts
    const driveTasksCount = inspection.tasks?.filter(t => t.target_type === 'drive').length || 0;
    const partTasksCount = inspection.tasks?.filter(t => t.target_type === 'part').length || 0;
    const generalTasksCount = tasksCount - driveTasksCount - partTasksCount;
    
    // Get latest results for timeline
    const latestResults = inspection.tasks?.flatMap(task => 
        task.results?.map(result => ({
            ...result,
            taskName: task.name,
            taskType: task.type
        })) || []
    ).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 5) || [];
    
    // Prepare data for charts
    const completionData = [
        { name: 'Completed', value: resultsCount, color: CHART_COLORS.green },
        { name: 'Pending', value: tasksCount - resultsCount, color: CHART_COLORS.gray }
    ].filter(item => item.value > 0);

    const resultsData = [
        { name: 'Passed', value: passedCount, color: CHART_COLORS.green },
        { name: 'Failed', value: failedCount, color: CHART_COLORS.red }
    ].filter(item => item.value > 0);

    const taskTypeData = [
        { name: 'Yes/No', value: inspection.tasks?.filter(t => t.type === 'yes_no').length || 0, color: CHART_COLORS.blue },
        { name: 'Numeric', value: inspection.tasks?.filter(t => t.type === 'numeric').length || 0, color: CHART_COLORS.purple }
    ].filter(item => item.value > 0);

    const targetTypeData = [
        { name: 'Drive', value: driveTasksCount, color: CHART_COLORS.blue },
        { name: 'Part', value: partTasksCount, color: CHART_COLORS.amber },
        { name: 'General', value: generalTasksCount, color: CHART_COLORS.purple }
    ].filter(item => item.value > 0);
    
    // Custom label for the pie chart
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, name } = props;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
        
        if (percent < 0.05) return null; // Don't show labels for small slices
        
        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor="middle" 
                dominantBaseline="central"
                className="font-medium text-xs"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };
    
    // Different view for template vs inspection instance
    if (inspection.is_template) {
        return (
            <div className="grid gap-6">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                        <h2 className="text-xl font-semibold">Template Configuration</h2>
                    </div>
                    <Badge variant="outline" className="px-2 py-1">Template</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Repeat className="h-4 w-4 text-gray-600" />
                                Schedule Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                            <div>
                                <dt className="font-medium text-gray-500 flex items-center gap-1.5">
                                    <Repeat className="h-3.5 w-3.5" /> Frequency
                                </dt>
                                    <dd className="mt-1 font-semibold">
                                    {formatFrequency(inspection.schedule_frequency, inspection.schedule_interval)}
                                </dd>
                            </div>
                             <div>
                                    <dt className="font-medium text-gray-500 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> Start Date
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                    {inspection.schedule_start_date 
                                        ? format(new Date(inspection.schedule_start_date), "PPP") 
                                            : <span className="text-gray-400 italic font-normal">Not Set</span>}
                                </dd>
                            </div>
                            <div>
                                    <dt className="font-medium text-gray-500 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> End Date
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                    {inspection.schedule_end_date 
                                        ? format(new Date(inspection.schedule_end_date), "PPP") 
                                            : <span className="text-gray-400 italic font-normal">No End Date</span>}
                                </dd>
                            </div>
                            <div>
                                    <dt className="font-medium text-gray-500 flex items-center gap-1.5">
                                        <Timer className="h-3.5 w-3.5" /> Next Due Date
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                    {inspection.schedule_next_due_date 
                                        ? format(new Date(inspection.schedule_next_due_date), "PPP") 
                                            : <span className="text-gray-400 italic font-normal">Not Scheduled</span>}
                                </dd>
                            </div>
                             <div>
                                    <dt className="font-medium text-gray-500 flex items-center gap-1.5">
                                        <History className="h-3.5 w-3.5" /> Last Instance Created
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                    {inspection.schedule_last_created_at 
                                        ? format(new Date(inspection.schedule_last_created_at), "Pp") 
                                            : <span className="text-gray-400 italic font-normal">Never</span>}
                                </dd>
                            </div>
                        </dl>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <BarChartIcon className="h-4 w-4 text-gray-600" />
                                Template Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-0">
                            <div className="text-3xl font-bold mb-1">{tasksCount}</div>
                            <div className="text-sm text-gray-500 mb-4">tasks defined</div>
                            
                            {tasksCount > 0 && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="mt-4 h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={targetTypeData}
                                                layout="vertical"
                                                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                                            >
                                                <XAxis type="number" hide />
                                                <YAxis 
                                                    type="category" 
                                                    dataKey="name" 
                                                    tick={{ fontSize: 12 }}
                                                    width={60}
                                                />
                                                <Tooltip 
                                                    formatter={(value: number) => [`${value} tasks`, 'Count']}
                                                    contentStyle={{ 
                                                        borderRadius: '0.375rem', 
                                                        border: '1px solid #e5e7eb',
                                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                                    }}
                                                />
                                                <Bar 
                                                    dataKey="value" 
                                                    radius={[0, 4, 4, 0]}
                                                >
                                                    {targetTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                    <LabelList 
                                                        dataKey="value" 
                                                        position="right" 
                                                        style={{ fontWeight: 500, fill: '#6b7280' }}
                                                        formatter={(value: number) => `${value}`}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="pt-2">
                            <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                <CheckSquareIcon className="h-3.5 w-3.5" /> 
                                {subTasksCount} subtasks across all tasks
                            </div>
                        </CardFooter>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <History className="h-4 w-4 text-gray-600" />
                            Instances History
                        </CardTitle>
                        <CardDescription>
                            Past inspection instances created from this template
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* This could be populated if we had instances data available */}
                        <div className="text-center py-8 text-gray-500">
                            <CalendarDays className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            <p>No instances have been created from this template yet</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    } else {
        return (
            <div className="grid gap-6">
                {/* Header with inspection health status */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                        <h2 className="text-xl font-semibold">Inspection Health</h2>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        {resultsCount > 0 ? (
                            <>
                                {healthStatus.icon}
                                <span className={`font-medium ${healthStatus.color}`}>
                                    {healthStatus.label}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                    {passRate}% pass rate
                                </Badge>
                            </>
                        ) : (
                            <>
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-500 font-medium">Awaiting Results</span>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Enhanced Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-gray-200 overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Tasks</CardTitle>
                                <div className="rounded-full p-1.5 bg-blue-50">
                                    <ClipboardList className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{tasksCount}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <CheckSquareIcon className="h-3 w-3" />
                                    {subTasksCount} subtasks
                                </div>
                            </div>
                            
                            {tasksCount > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div>
                                            <div className="font-medium">{driveTasksCount}</div>
                                            <div className="text-gray-500">Drives</div>
                                        </div>
                                        <div>
                                            <div className="font-medium">{partTasksCount}</div>
                                            <div className="text-gray-500">Parts</div>
                                        </div>
                                        <div>
                                            <div className="font-medium">{generalTasksCount}</div>
                                            <div className="text-gray-500">Other</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200 overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Completion</CardTitle>
                                <div className="rounded-full p-1.5 bg-emerald-50">
                                    <BarChart3 className="h-4 w-4 text-emerald-600" />
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
                            <Progress className="h-2 mt-2" value={completionPercentage} />
                            
                            {tasksCount > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-600">
                                        {completionPercentage === 100 ? (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckIcon className="h-3.5 w-3.5" />
                                                Inspection completed
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {tasksCount - resultsCount} tasks remaining
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200 overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Passed</CardTitle>
                                <div className="rounded-full p-1.5 bg-green-50">
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{passedCount}</div>
                                <div className="text-xs text-gray-500">
                                    {resultsCount > 0 ? `${passRate}% pass rate` : 'No results yet'}
                                </div>
                            </div>
                            
                            {resultsCount > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-600 flex items-center gap-1">
                                        {passRate >= 90 ? (
                                            <>
                                                <ArrowUpCircle className="h-3.5 w-3.5 text-green-600" />
                                                <span className="text-green-600">Excellent condition</span>
                                            </>
                                        ) : passRate >= 75 ? (
                                            <>
                                                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                <span className="text-emerald-600">Good condition</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                                <span className="text-amber-600">Needs attention</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-gray-200 overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">Failed</CardTitle>
                                <div className="rounded-full p-1.5 bg-red-50">
                                    <XIcon className="h-4 w-4 text-red-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">{failedCount}</div>
                                <div className="text-xs text-gray-500">
                                    {resultsCount > 0 ? `${100 - passRate}% fail rate` : 'No results yet'}
                                </div>
                            </div>
                            
                            {resultsCount > 0 && failedCount > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-600 flex items-center gap-1">
                                        <Wrench className="h-3.5 w-3.5 text-gray-500" />
                                        {failedCount > 3 ? (
                                            <span className="text-red-600">Immediate attention needed</span>
                                        ) : (
                                            <span>Maintenance recommended</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                {/* Charts and Metadata Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts take 2/3 of the width on large screens */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <PieChartIcon className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                Completion Status
                            </CardTitle>
                        </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-4">
                            {tasksCount > 0 ? (
                                    <>
                                        <div className="relative w-full h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={completionData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={renderCustomizedLabel}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        paddingAngle={2}
                                                    >
                                                        {completionData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        formatter={(value: number) => [`${value} tasks`, '']}
                                                        contentStyle={{ 
                                                            borderRadius: '0.375rem', 
                                                            border: '1px solid #e5e7eb',
                                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <div className="text-3xl font-bold">{completionPercentage}%</div>
                                                <div className="text-xs text-gray-500">completed</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 justify-center mt-2">
                                            {completionData.map((entry, index) => (
                                                <div key={index} className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                                                    <span className="text-xs text-gray-700">{entry.name}: {entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">No tasks</div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <FileBarChart className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                Result Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-4">
                                {resultsCount > 0 ? (
                                    <>
                                        <div className="w-full h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={resultsData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={renderCustomizedLabel}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        paddingAngle={2}
                                                    >
                                                        {resultsData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        formatter={(value: number) => [`${value} tasks`, '']}
                                                        contentStyle={{ 
                                                            borderRadius: '0.375rem', 
                                                            border: '1px solid #e5e7eb',
                                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex gap-6 justify-center mt-2">
                                            {resultsData.map((entry, index) => (
                                                <div key={index} className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                                                    <span className="text-xs text-gray-700">{entry.name}: {entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-full mt-4 bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500 ease-out"
                                                style={{ 
                                                    width: `${passRate}%`, 
                                                    backgroundColor: passRate >= 75 ? CHART_COLORS.green : 
                                                                     passRate >= 50 ? CHART_COLORS.amber : 
                                                                     CHART_COLORS.red 
                                                }}
                                            />
                                        </div>
                                        <div className="text-center mt-2">
                                            <span className="text-sm font-medium" style={{ 
                                                color: passRate >= 75 ? CHART_COLORS.green : 
                                                       passRate >= 50 ? CHART_COLORS.amber : 
                                                       CHART_COLORS.red 
                                            }}>
                                                {passRate}% Pass Rate
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">No results yet</div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <History className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {latestResults.length > 0 ? (
                                    <div className="space-y-4">
                                        {latestResults.map((result, index) => (
                                            <div key={result.id} className="flex gap-3">
                                                <div className={`rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 ${result.is_passing ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    {result.is_passing ? (
                                                        <CheckIcon className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <XIcon className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium">{result.taskName}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistance(new Date(result.created_at), new Date(), { addSuffix: true })}
                                                        {result.performer && (
                                                            <>
                                                                <span className="text-gray-300 mx-1">•</span>
                                                                <User className="h-3 w-3" />
                                                                {result.performer.name}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs">
                                                    {result.taskType === 'yes_no' 
                                                        ? (result.value_boolean ? 'Yes' : 'No')
                                                        : `${result.value_numeric}`
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p>No activity recorded yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Metadata card takes 1/3 of the width on large screens */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                Inspection Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-4 text-sm">
                                <div>
                                    <dt className="text-gray-500">Status</dt>
                                    <dd className="mt-1 font-medium">
                                        <Badge className={getStatusBadgeClasses(inspection.status)}>
                                            <span className="flex items-center gap-1">
                                                {getStatusIcon(inspection.status)}
                                                {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                                            </span>
                                        </Badge>
                                    </dd>
                                </div>
                                
                                <div>
                                    <dt className="text-gray-500">Created By</dt>
                                    <dd className="mt-1 font-medium flex items-center gap-1.5">
                                        <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                            {inspection.creator?.name.charAt(0)}
                                        </div>
                                        <span>{inspection.creator?.name}</span>
                                    </dd>
                                </div>
                                
                                {inspection.operator && (
                                    <div>
                                        <dt className="text-gray-500">Assigned Operator</dt>
                                        <dd className="mt-1 font-medium flex items-center gap-1.5">
                                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                                                {inspection.operator.name.charAt(0)}
                                            </div>
                                            <span>{inspection.operator.name}</span>
                                        </dd>
                                    </div>
                                )}
                                
                                {inspection.completedBy && (
                                    <div>
                                        <dt className="text-gray-500">Completed By</dt>
                                        <dd className="mt-1 font-medium flex items-center gap-1.5">
                                            <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-xs text-green-600">
                                                {inspection.completedBy.name.charAt(0)}
                                            </div>
                                            <span>{inspection.completedBy.name}</span>
                                        </dd>
                                    </div>
                                )}
                                
                                <div>
                                    <dt className="text-gray-500">Created Date</dt>
                                    <dd className="mt-1 font-medium">
                                        {format(new Date(inspection.created_at), 'PPP')}
                                    </dd>
                                </div>
                                
                                {inspection.parentTemplate && (
                                    <div>
                                        <dt className="text-gray-500">Created From</dt>
                                        <dd className="mt-1 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                                <span>{inspection.parentTemplate.name}</span>
                                            </div>
                                        </dd>
                                    </div>
                                )}
                                
                                <Separator />
                                
                                <div>
                                    <dt className="text-gray-500">Task Breakdown</dt>
                                    <dd className="mt-2">
                                        {tasksCount > 0 ? (
                                            <div className="h-24">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={taskTypeData}
                                                        layout="vertical"
                                                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                                    >
                                                        <XAxis type="number" hide />
                                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={55} />
                                                        <Tooltip 
                                                            formatter={(value: number) => [`${value} tasks`, '']}
                                                            contentStyle={{ 
                                                                borderRadius: '0.375rem', 
                                                                border: '1px solid #e5e7eb',
                                                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                                            }}
                                                        />
                                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                            {taskTypeData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                            <LabelList dataKey="value" position="right" style={{ fontWeight: 500, fill: '#6b7280' }} />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                            ) : (
                                            <div className="text-center py-2 text-gray-500 text-sm">
                                                No tasks defined
                                            </div>
                            )}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                        <CardFooter className="flex justify-center border-t pt-4">
                            <Button variant="outline" size="sm" className="w-full">
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }
} 