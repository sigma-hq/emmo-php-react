import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
    Building, 
    Wrench, 
    Package, 
    Hourglass, 
    TrendingUp, 
    ClipboardCheck, 
    FileText, 
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    Users,
    Activity,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';

import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    PieChart,
    Pie,
    Cell,
    BarChart as RechartsBarChart,
    Bar
} from 'recharts';

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from '@/components/ui/chart';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
];

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    footerText?: string;
    footerLink?: string;
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, footerText, footerLink, className }) => (
    <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                {icon}
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {footerText && (
                <p className="text-xs text-muted-foreground mt-2">
                    {footerLink ? <Link href={footerLink}>{footerText}</Link> : footerText}
                </p>
            )}
        </CardContent>
    </Card>
);

interface ChartCardProps {
    title: string;
    description?: string;
    className?: string;
    children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, description, className, children }) => (
    <Card className={className}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

interface ActivityItemProps {
    title: string;
    description: string;
    timestamp: string;
    status: string;
    icon: React.ReactNode;
}

const activityStatusVariants = cva("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", {
    variants: {
        status: {
            completed: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
            active: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
            scheduled: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
            in_progress: "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20",
            pending: "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20",
            draft: "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20",
            archived: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
            default: "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20",
        }
    },
    defaultVariants: {
        status: "default"
    }
});

const ActivityItem: React.FC<ActivityItemProps & { link?: string }> = ({ title, description, timestamp, status, icon, link }) => {
    const formattedDate = format(new Date(timestamp), 'MMM d, yyyy');
    
    const content = (
        <>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                <div className="flex flex-wrap gap-2 mt-1 items-center">
                    <span className={cn(activityStatusVariants({ status: status as any }))}>
                        {status}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{description}</span>
                </div>
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap">{formattedDate}</div>
        </>
    );

    return (
        <div className="flex gap-4 items-start py-3 border-b last:border-0 hover:bg-gray-50/50 transition-colors">
            {link ? (
                <Link href={link} className="flex gap-4 items-start w-full">
                    {content}
                </Link>
            ) : (
                content
            )}
        </div>
    );
};

interface InspectionsStats {
    total: number;
    total_assigned?: number; // Total assigned (including completed)
    active: number;
    pending_review: number;
    completed: number;
    failed?: number; // Failed inspections count
    draft: number;
    due_soon: number;
    overdue: number;
}

interface MaintenancesStats {
    total: number;
    scheduled: number;
    in_progress: number;
    completed: number;
    needs_scheduling: number;
}

interface DrivesStats {
    total: number;
}

interface PartsStats {
    total: number;
    attached: number;
    unattached: number;
}

interface ChartData {
    name: string;
    value: number;
}

interface TrendData {
    name: string;
    created: number;
    completed: number;
}

interface RecentItem {
    id: number;
    name?: string;
    description?: string;
    status: string;
    created_at: string;
    created_by: string;
    operator_name?: string;
}

interface UserPerformanceData {
    user_id: number;
    user_name: string;
    user_email: string;
    role: string;
    total_inspections: number;
    completed_inspections: number;
    failed_inspections: number;
    completion_rate: number;
    failure_rate: number;
    total_maintenances: number;
    completed_maintenances: number;
    pending_maintenances: number;
    maintenance_completion_rate: number;
    created_at: string;
}

interface OverallPerformanceStats {
    total_users: number;
    active_performers: number;
    avg_completion_rate: number;
    total_inspections_performed: number;
    total_maintenances_created: number;
}

interface DashboardProps {
    inspectionsStats: InspectionsStats;
    maintenancesStats: MaintenancesStats;
    drivesStats: DrivesStats;
    partsStats: PartsStats;
    inspectionStatusChart: ChartData[];
    maintenanceStatusChart: ChartData[];
    partsChart: ChartData[];
    inspectionTrend: TrendData[];
    recentInspections: RecentItem[];
    recentMaintenances: RecentItem[];
    userPerformanceData?: UserPerformanceData[];
    overallPerformanceStats?: OverallPerformanceStats;
    isAdmin?: boolean;
    userRole?: string;
    userName?: string;
}

// After the DashboardProps interface and before the component definition
// Add this color palette
const CHART_COLORS = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#84cc16"  // lime-500
];

export default function Dashboard({ 
    inspectionsStats,
    maintenancesStats,
    drivesStats,
    partsStats,
    inspectionStatusChart,
    maintenanceStatusChart,
    partsChart,
    inspectionTrend,
    recentInspections,
    recentMaintenances,
    userPerformanceData,
    overallPerformanceStats,
    isAdmin,
    userRole,
    userName
}: DashboardProps) {
    // Update the chart configs to use explicit colors
    const inspectionTrendConfig: ChartConfig = {
        created: {
            label: "Created",
            color: CHART_COLORS[0],
        },
        completed: {
            label: "Completed",
            color: CHART_COLORS[1],
        }
    };

    const inspectionStatusConfig: ChartConfig = {
        Active: {
            label: "Active",
            color: CHART_COLORS[0],
        },
        "Pending Review": {
            label: "Pending Review",
            color: CHART_COLORS[1],
        },
        Completed: {
            label: "Completed",
            color: CHART_COLORS[2],
        },
        Draft: {
            label: "Draft",
            color: CHART_COLORS[3],
        }
    };

    const partsConfig: ChartConfig = {
        Attached: {
            label: "Attached",
            color: CHART_COLORS[0],
        },
        Unattached: {
            label: "Unattached",
            color: CHART_COLORS[2],
        }
    };

    const maintenanceStatusConfig: ChartConfig = {
        Scheduled: {
            label: "Scheduled",
            color: CHART_COLORS[0],
        },
        "In Progress": {
            label: "In Progress",
            color: CHART_COLORS[1],
        },
        Completed: {
            label: "Completed",
            color: CHART_COLORS[2],
        },
        "Needs Scheduling": {
            label: "Needs Scheduling",
            color: CHART_COLORS[3],
        }
    };

    // Transform chart data to match Shadcn's format if needed
    const transformedInspectionStatusData = inspectionStatusChart.map(item => ({
        name: item.name,
        [item.name]: item.value
    }));

    const transformedPartsData = partsChart.map(item => ({
        name: item.name,
        [item.name]: item.value
    }));

    const transformedMaintenanceStatusData = maintenanceStatusChart.map(item => ({
        name: item.name,
        [item.name]: item.value
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 md:p-6">
                {/* Welcome Message */}
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {userName || (isAdmin ? 'Administrator' : 'Operator')}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isAdmin 
                            ? 'Here\'s an overview of all system activities and statistics.' 
                            : 'Here\'s your assigned inspections and relevant information.'}
                    </p>
                </div>

                {/* Summary Statistics */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-6">
                    {isAdmin ? (
                        // Admin sees all statistics
                        <>
                            <StatCard 
                                title="Total Drives" 
                                value={drivesStats.total} 
                                icon={<Building className="h-4 w-4 text-muted-foreground" />} 
                                footerLink={route('drive')}
                                footerText="View all drives"
                            />
                            <StatCard 
                                title="Total Parts" 
                                value={partsStats.total} 
                                icon={<Package className="h-4 w-4 text-muted-foreground" />} 
                                footerLink={route('parts')}
                                footerText={`${partsStats.attached} attached, ${partsStats.unattached} unattached`}
                            />
                            <StatCard 
                                title="Active Inspections" 
                                value={inspectionsStats.active} 
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} 
                                footerText={`${inspectionsStats.due_soon} due soon, ${inspectionsStats.overdue} overdue`}
                                footerLink={route('inspections')}
                            />
                            <StatCard 
                                title="Pending Maintenances" 
                                value={maintenancesStats.needs_scheduling + maintenancesStats.scheduled + maintenancesStats.in_progress}
                                icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
                                footerText={`${maintenancesStats.scheduled} scheduled, ${maintenancesStats.in_progress} in progress`}
                                footerLink={route('maintenances')}
                            />
                        </>
                    ) : (
                        // Operator sees only their relevant statistics
                        <>
                            <StatCard 
                                title="Remaining Inspections" 
                                value={inspectionsStats.total} 
                                icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />} 
                                footerLink={route('inspections')}
                                footerText={`${inspectionsStats.total_assigned || 0} total assigned`}
                            />
                            <StatCard 
                                title="Active Inspections" 
                                value={inspectionsStats.active} 
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} 
                                footerText={`${inspectionsStats.due_soon} due soon, ${inspectionsStats.overdue} overdue`}
                                footerLink={route('inspections')}
                            />
                            <StatCard 
                                title="Completed Inspections" 
                                value={inspectionsStats.completed} 
                                icon={<FileText className="h-4 w-4 text-muted-foreground" />} 
                                footerText="View completed inspections"
                                footerLink={route('inspections')}
                            />
                            <StatCard 
                                title="Failed Inspections" 
                                value={inspectionsStats.failed || 0} 
                                icon={<XCircle className="h-4 w-4 text-muted-foreground" />} 
                                footerText="View failed inspections"
                                footerLink={route('inspections')}
                            />
                            <StatCard 
                                title="My Maintenances" 
                                value={maintenancesStats.total} 
                                icon={<Wrench className="h-4 w-4 text-muted-foreground" />} 
                                footerLink={route('maintenances')}
                                footerText={`${maintenancesStats.in_progress} in progress, ${maintenancesStats.completed} completed`}
                            />
                            <StatCard 
                                title="Available Drives" 
                                value={drivesStats.total} 
                                icon={<Building className="h-4 w-4 text-muted-foreground" />} 
                                footerLink={route('drive')}
                                footerText="View all drives"
                            />
                        </>
                    )}
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isAdmin ? (
                        // Admin sees all charts
                        <>
                            {/* Line Chart - Inspection Trends */}
                            <Card className="col-span-full lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChartIcon className="h-5 w-5" />
                                    Inspection Trends
                                </CardTitle>
                                <CardDescription>Created vs Completed inspections over time</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={inspectionTrendConfig} className="h-[200px] w-full">
                                <LineChart accessibilityLayer data={inspectionTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        tickLine={false} 
                                        tickMargin={10} 
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="created" 
                                        stroke={inspectionTrendConfig.created.color} 
                                        activeDot={{ r: 8 }} 
                                        strokeWidth={2} 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="completed" 
                                        stroke={inspectionTrendConfig.completed.color} 
                                        strokeWidth={2} 
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Pie Chart - Parts Distribution */}
                    <Card>
                        <CardHeader className="flex flex-row items-center pb-2">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5" />
                                    Parts Distribution
                                </CardTitle>
                                <CardDescription>Attached vs Unattached parts</CardDescription>
                    </div>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={partsConfig} className="min-h-[50px] w-full">
                                <PieChart>
                                    <Pie
                                        data={transformedPartsData}
                                        dataKey={item => item[item.name]}
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                    >
                                        {transformedPartsData.map((entry, index) => (
                                            <Cell key={`cell-${entry.name}`} fill={partsConfig[entry.name as keyof typeof partsConfig]?.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Pie Chart - Inspection Status */}
                    <Card>
                        <CardHeader className="flex flex-row items-center pb-2">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5" />
                                    Inspection Status
                                </CardTitle>
                                <CardDescription>Distribution of inspection statuses</CardDescription>
                    </div>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={inspectionStatusConfig} className="min-h-[250px] w-full">
                                <PieChart>
                                    <Pie
                                        data={transformedInspectionStatusData}
                                        dataKey={item => item[item.name]}
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                    >
                                        {transformedInspectionStatusData.map((entry, index) => (
                                            <Cell key={`cell-${entry.name}`} fill={inspectionStatusConfig[entry.name as keyof typeof inspectionStatusConfig]?.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Bar Chart - Maintenance Status */}
                    <Card className="col-span-full lg:col-span-2 ">
                        <CardHeader className="flex flex-row items-center pb-2">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChartIcon className="h-5 w-5" />
                                    Maintenance Status
                                </CardTitle>
                                <CardDescription>Distribution of maintenance statuses</CardDescription>
                    </div>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={maintenanceStatusConfig} className="max-h-[280px] w-full">
                                <RechartsBarChart
                                    data={transformedMaintenanceStatusData}
                                    margin={{ top: 5, right: 30, left: 0, bottom: 25 }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="name" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        tickLine={false} 
                                        tickMargin={10} 
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    {/* <ChartLegend content={<ChartLegendContent />} /> */}
                                    {transformedMaintenanceStatusData.map((entry, index) => (
                                        <Bar
                                            key={`bar-${entry.name}`}
                                            dataKey={entry.name}
                                            fill={maintenanceStatusConfig[entry.name as keyof typeof maintenanceStatusConfig]?.color || CHART_COLORS[index % CHART_COLORS.length]}
                                            radius={4}
                                        />
                                    ))}
                                </RechartsBarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                        </>
                    ) : (
                        // Operator sees only their inspection status chart
                        <>
                            {/* Pie Chart - My Inspection Status */}
                            <Card className="col-span-full lg:col-span-2">
                                <CardHeader className="flex flex-row items-center pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <PieChartIcon className="h-5 w-5" />
                                            My Inspection Status
                                        </CardTitle>
                                        <CardDescription>Distribution of your assigned inspection statuses</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={inspectionStatusConfig} className="min-h-[250px] w-full">
                                        <PieChart>
                                            <Pie
                                                data={transformedInspectionStatusData}
                                                dataKey={item => item[item.name]}
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                            >
                                                {transformedInspectionStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${entry.name}`} fill={inspectionStatusConfig[entry.name as keyof typeof inspectionStatusConfig]?.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <ChartLegend content={<ChartLegendContent />} />
                                        </PieChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Quick Actions Card for Operators */}
                            <Card>
                                <CardHeader className="flex flex-row items-center pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardCheck className="h-5 w-5" />
                                            Quick Actions
                                        </CardTitle>
                                        <CardDescription>Common tasks and shortcuts</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Link 
                                        href={route('inspections')}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <ClipboardCheck className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                        <div>
                                            <div className="font-medium">View My Inspections</div>
                                            <div className="text-sm text-gray-500">Check assigned inspections</div>
                                        </div>
                                    </Link>
                                    <Link 
                                        href={route('drive')}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <Building className="h-4 w-4 text-[var(--emmo-green-primary)]" />
                                        <div>
                                            <div className="font-medium">View Drives</div>
                                            <div className="text-sm text-gray-500">Access drive information</div>
                                        </div>
                                    </Link>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Recent Activity Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {isAdmin ? (
                        // Admin sees both inspections and maintenances
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Recent Inspections
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y">
                                        {recentInspections.length > 0 ? (
                                            recentInspections.map((inspection) => (
                                                <ActivityItem
                                                    key={inspection.id}
                                                    link={route('inspections.show', inspection.id)}
                                                    title={inspection.name || `Inspection #${inspection.id}`}
                                                    description={`Operator: ${inspection.operator_name || 'N/A'} • By: ${inspection.created_by}`}
                                                    timestamp={inspection.created_at}
                                                    status={inspection.status}
                                                    icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground py-4">No recent inspections found.</p>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Link href={route('inspections')} className="text-sm text-primary hover:underline">
                                        View all inspections
                                    </Link>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Wrench className="h-5 w-5" />
                                        Recent Maintenances
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y">
                                        {recentMaintenances.length > 0 ? (
                                            recentMaintenances.map((maintenance) => (
                                                <ActivityItem
                                                    key={maintenance.id}
                                                    title={maintenance.description || `Maintenance #${maintenance.id}`}
                                                    description={`Created by ${maintenance.created_by}`}
                                                    timestamp={maintenance.created_at}
                                                    status={maintenance.status}
                                                    icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground py-4">No recent maintenances found.</p>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Link href={route('maintenances')} className="text-sm text-primary hover:underline">
                                        View all maintenances
                                    </Link>
                                </CardFooter>
                            </Card>
                        </>
                    ) : (
                        // Operator sees only their assigned inspections
                        <>
                            <Card className="col-span-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        My Recent Inspections
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y">
                                        {recentInspections.length > 0 ? (
                                            recentInspections.map((inspection) => (
                                                <ActivityItem
                                                    key={inspection.id}
                                                    link={route('inspections.show', inspection.id)}
                                                    title={inspection.name || `Inspection #${inspection.id}`}
                                                    description={`Created by ${inspection.created_by}`}
                                                    timestamp={inspection.created_at}
                                                    status={inspection.status}
                                                    icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground py-4">No assigned inspections found.</p>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Link href={route('inspections')} className="text-sm text-primary hover:underline">
                                        View my inspections
                                    </Link>
                                </CardFooter>
                            </Card>
                        </>
                    )}
                </div>

                {/* User Performance Section - Admin Only */}
                {isAdmin && userPerformanceData && userPerformanceData.length > 0 && (
                    <div className="space-y-4">
                        {/* Performance Summary Cards */}
                        {overallPerformanceStats && (
                            <div className="grid gap-4 grid-cols-5">
                                <StatCard 
                                    title="Total Users" 
                                    value={overallPerformanceStats.total_users} 
                                    icon={<Users className="h-4 w-4 text-muted-foreground" />} 
                                />
                                <StatCard 
                                    title="Active Performers" 
                                    value={overallPerformanceStats.active_performers} 
                                    icon={<Activity className="h-4 w-4 text-muted-foreground" />} 
                                />
                                <StatCard 
                                    title="Avg Completion Rate" 
                                    value={`${overallPerformanceStats.avg_completion_rate}%`} 
                                    icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} 
                                />
                                <StatCard 
                                    title="Inspections Performed" 
                                    value={overallPerformanceStats.total_inspections_performed} 
                                    icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />} 
                                />
                                <StatCard 
                                    title="Maintenances Created" 
                                    value={overallPerformanceStats.total_maintenances_created} 
                                    icon={<Wrench className="h-4 w-4 text-muted-foreground" />} 
                                />
                            </div>
                        )}

                        {/* Top Performers */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChartIcon className="h-5 w-5" />
                                    Top Performers
                                </CardTitle>
                                <CardDescription>
                                    Users with the highest completion rates and performance metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {userPerformanceData
                                        .filter(user => user.total_inspections > 0 || user.total_maintenances > 0)
                                        .sort((a, b) => b.completion_rate - a.completion_rate)
                                        .slice(0, 5)
                                        .map((user, index) => (
                                            <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                        index === 0 ? 'bg-yellow-500' :
                                                        index === 1 ? 'bg-gray-400' :
                                                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                            user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
                                                        }`}>
                                                            <Users className={`h-5 w-5 ${
                                                                user.role === 'admin' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                                                            }`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-gray-900 dark:text-white">{user.user_name}</h3>
                                                            <p className="text-sm text-gray-500">{user.user_email}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    user.role === 'admin' 
                                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                                                }`}>
                                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {user.completion_rate}%
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.completed_inspections} of {user.total_inspections} inspections
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {user.total_maintenances} maintenances created
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={route('users')} className="text-sm text-primary hover:underline">
                                    View detailed performance metrics
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Performance Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    Performance Alerts
                                </CardTitle>
                                <CardDescription>
                                    Users who may need attention or support
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {userPerformanceData
                                        .filter(user => 
                                            (user.total_inspections > 0 && user.completion_rate < 60) ||
                                            (user.total_inspections > 0 && user.failure_rate > 20) ||
                                            (user.total_inspections === 0 && user.total_maintenances === 0)
                                        )
                                        .map((user) => (
                                            <div key={user.user_id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
                                                <div className="flex items-center gap-3">
                                                    <XCircle className="h-4 w-4 text-orange-600" />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{user.user_name}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {user.total_inspections === 0 && user.total_maintenances === 0 
                                                                ? 'No activity recorded'
                                                                : user.completion_rate < 60 
                                                                    ? `Low completion rate: ${user.completion_rate}%`
                                                                    : `High failure rate: ${user.failure_rate}%`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link 
                                                    href={route('users')} 
                                                    className="text-sm text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                                                >
                                                    Review
                                                </Link>
                                            </div>
                                        ))}
                                    {userPerformanceData.filter(user => 
                                        (user.total_inspections > 0 && user.completion_rate < 60) ||
                                        (user.total_inspections > 0 && user.failure_rate > 20) ||
                                        (user.total_inspections === 0 && user.total_maintenances === 0)
                                    ).length === 0 && (
                                        <div className="text-center py-4">
                                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">All users are performing well!</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
