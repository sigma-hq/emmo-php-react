import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    HardDrive, 
    ClipboardCheck, 
    Wrench, 
    TrendingUp, 
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    BarChart3,
    Zap,
    Gauge
} from 'lucide-react';
import { useState } from 'react';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    parts_count: number;
    maintenances_count: number;
}

interface DrivePerformance {
    drive: Drive;
    stats: {
        total_inspections: number;
        completed_inspections: number;
        completion_rate: number;
        total_results: number;
        passed_results: number;
        failed_results: number;
        pass_rate: number;
        total_maintenances: number;
        completed_maintenances: number;
        pending_maintenances: number;
        health_score: number;
    };
    daily_activity: Array<{
        date: string;
        inspections: number;
        results: number;
        maintenances: number;
    }>;
    recent_issues: Array<{
        type: 'failed_inspection' | 'pending_maintenance';
        id: number;
        task_name?: string;
        title?: string;
        performed_by?: string;
        created_by?: string;
        created_at: string;
        notes?: string;
        created_from_inspection?: boolean;
    }>;
    recent_inspections: Array<{
        id: number;
        name: string;
        status: string;
        created_at: string;
        operator_name: string;
    }>;
    recent_maintenances: Array<{
        id: number;
        title: string;
        status: string;
        created_at: string;
        created_from_inspection: boolean;
    }>;
}

interface OverallStats {
    total_drives: number;
    drives_with_issues: number;
    total_inspections: number;
    total_results: number;
    passed_results: number;
    pass_rate: number;
    total_maintenances: number;
    pending_maintenances: number;
}

interface RecentActivity {
    type: 'inspection' | 'result' | 'maintenance';
    id: number;
    name: string;
    status: string;
    drive_name: string;
    operator_name: string;
    created_at: string;
}

interface DrivePerformancePageProps {
    drives: Drive[];
    selectedDrive: Drive | null;
    drivePerformance: DrivePerformance | null;
    overallStats: OverallStats;
    recentActivity: RecentActivity[];
    dateRange: string;
    selectedDriveId: string | null;
    isAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Drive Performance',
        href: '/drive/performance',
    },
];

export default function DrivePerformance({ 
    drives, 
    selectedDrive, 
    drivePerformance, 
    overallStats, 
    recentActivity, 
    dateRange, 
    selectedDriveId,
    isAdmin
}: DrivePerformancePageProps) {
    const [selectedDriveState, setSelectedDriveState] = useState(selectedDriveId);
    const [dateRangeState, setDateRangeState] = useState(dateRange);

    const handleDriveChange = (driveId: string) => {
        setSelectedDriveState(driveId);
        router.get('/drive/performance', {
            drive_id: driveId,
            date_range: dateRangeState
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDateRangeChange = (range: string) => {
        setDateRangeState(range);
        router.get('/drive/performance', {
            drive_id: selectedDriveState,
            date_range: range
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Completed</Badge>;
            case 'active':
                return <Badge variant="secondary">Active</Badge>;
            case 'draft':
                return <Badge variant="outline">Draft</Badge>;
            case 'Passed':
                return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Passed</Badge>;
            case 'Failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'pending':
                return <Badge variant="outline">Pending</Badge>;
            case 'in_progress':
                return <Badge variant="secondary">In Progress</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'inspection':
                return <ClipboardCheck className="h-4 w-4" />;
            case 'result':
                return <CheckCircle className="h-4 w-4" />;
            case 'maintenance':
                return <Wrench className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getHealthScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Poor';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Drive Performance Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Drive Performance Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Monitor individual drive performance and health status
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Drive</label>
                        <Select value={selectedDriveState || ''} onValueChange={handleDriveChange}>
                            <SelectTrigger className="w-full sm:w-64">
                                <SelectValue placeholder="Choose a drive..." />
                            </SelectTrigger>
                            <SelectContent>
                                {drives.map((drive) => (
                                    <SelectItem key={drive.id} value={drive.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4" />
                                            {drive.name} ({drive.drive_ref})
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                        <Select value={dateRangeState} onValueChange={handleDateRangeChange}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Overall Statistics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Drives</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overallStats.total_drives}</div>
                            <p className="text-xs text-muted-foreground">
                                {overallStats.drives_with_issues} with issues
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
                            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overallStats.total_inspections}</div>
                            <p className="text-xs text-muted-foreground">
                                {overallStats.pass_rate}% pass rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Maintenances</CardTitle>
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overallStats.total_maintenances}</div>
                            <p className="text-xs text-muted-foreground">
                                {overallStats.pending_maintenances} pending
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overallStats.pass_rate}%</div>
                            <p className="text-xs text-muted-foreground">
                                Average pass rate
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Drive Performance Details */}
                {drivePerformance && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Drive Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HardDrive className="h-5 w-5" />
                                    {drivePerformance.drive.name} - Performance Stats
                                </CardTitle>
                                <CardDescription>
                                    {drivePerformance.drive.drive_ref} • {drivePerformance.drive.location || 'No location'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Health Score */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Health Score</span>
                                        <span className={`text-sm font-bold ${getHealthScoreColor(drivePerformance.stats.health_score)}`}>
                                            {drivePerformance.stats.health_score}/100
                                        </span>
                                    </div>
                                    <Progress value={drivePerformance.stats.health_score} className="h-2" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {getHealthScoreLabel(drivePerformance.stats.health_score)} health status
                                    </p>
                                </div>

                                {/* Inspection Stats */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Inspections</span>
                                        <span className="text-sm text-muted-foreground">
                                            {drivePerformance.stats.completed_inspections}/{drivePerformance.stats.total_inspections}
                                        </span>
                                    </div>
                                    <Progress value={drivePerformance.stats.completion_rate} className="h-2" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {drivePerformance.stats.completion_rate}% completion rate
                                    </p>
                                </div>

                                {/* Results Stats */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Results</span>
                                        <span className="text-sm text-muted-foreground">
                                            {drivePerformance.stats.passed_results}/{drivePerformance.stats.total_results}
                                        </span>
                                    </div>
                                    <Progress value={drivePerformance.stats.pass_rate} className="h-2" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {drivePerformance.stats.pass_rate}% pass rate
                                    </p>
                                </div>

                                {/* Maintenance Stats */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Maintenances</span>
                                        <span className="text-sm text-muted-foreground">
                                            {drivePerformance.stats.completed_maintenances}/{drivePerformance.stats.total_maintenances}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={drivePerformance.stats.total_maintenances > 0 ? 
                                            (drivePerformance.stats.completed_maintenances / drivePerformance.stats.total_maintenances) * 100 : 0
                                        } 
                                        className="h-2" 
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {drivePerformance.stats.pending_maintenances} pending maintenances
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Issues */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Recent Issues
                                </CardTitle>
                                <CardDescription>
                                    Latest problems and pending actions for {drivePerformance.drive.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {drivePerformance.recent_issues.length > 0 ? (
                                        drivePerformance.recent_issues.map((issue) => (
                                            <div key={`${issue.type}-${issue.id}`} className="flex items-center justify-between p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                                                <div className="flex items-center gap-3">
                                                    {issue.type === 'failed_inspection' ? (
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-yellow-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {issue.type === 'failed_inspection' ? issue.task_name : issue.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {issue.type === 'failed_inspection' ? 
                                                                `by ${issue.performed_by}` : 
                                                                `by ${issue.created_by}`
                                                            } • {new Date(issue.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="destructive">
                                                    {issue.type === 'failed_inspection' ? 'Failed' : 'Pending'}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground">
                                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                            <p>No recent issues found</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* System-wide Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            System-wide Recent Activity
                        </CardTitle>
                        <CardDescription>
                            Latest activities across all drives
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActivity.map((activity) => (
                                <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        {getActivityIcon(activity.type)}
                                        <div>
                                            <p className="text-sm font-medium">{activity.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.drive_name} • by {activity.operator_name} • {new Date(activity.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(activity.status)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 