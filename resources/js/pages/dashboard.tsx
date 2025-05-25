import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
    Building, 
    Wrench, 
    Package, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    Hourglass, 
    TrendingUp, 
    ClipboardCheck, 
    CalendarClock, 
    FileText, 
    BarChart as BarChartIcon,
    PieChart as PieChartIcon
} from 'lucide-react';

import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
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
    active: number;
    pending_review: number;
    completed: number;
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
    recentMaintenances 
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
                {/* Summary Statistics */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                </div>

                {/* Recent Activity Section */}
                <div className="grid gap-4 md:grid-cols-2">
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
                </div>
            </div>
        </AppLayout>
    );
}
