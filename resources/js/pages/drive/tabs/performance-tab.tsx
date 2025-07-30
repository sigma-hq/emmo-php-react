import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Loader2 } from 'lucide-react';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    parts: any[];
}

interface DrivePerformance {
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
}

interface PerformanceTabProps {
    drive: Drive;
    performanceData: DrivePerformance | null;
    loading: boolean;
    isAdmin?: boolean;
}

export default function PerformanceTab({ drive, performanceData, loading, isAdmin }: PerformanceTabProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading performance data...</span>
                </div>
            </div>
        );
    }

    if (!performanceData) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Drive Performance</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Performance metrics for {drive.name}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Performance Data
                        </CardTitle>
                        <CardDescription>
                            Click the Performance tab to load data for {drive.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">Performance data will be loaded when you select this tab</p>
                            <p className="text-sm text-gray-400 mt-2">Drive ID: {drive.id}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Drive Performance</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Performance metrics for {drive.name}
                </p>
            </div>

            {/* Simple Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.stats.health_score}/100</div>
                        <p className="text-xs text-muted-foreground">
                            Overall health status
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inspections</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.stats.total_inspections}</div>
                        <p className="text-xs text-muted-foreground">
                            {performanceData.stats.completion_rate}% completion rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.stats.total_results}</div>
                        <p className="text-xs text-muted-foreground">
                            {performanceData.stats.pass_rate}% pass rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Maintenances</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.stats.total_maintenances}</div>
                        <p className="text-xs text-muted-foreground">
                            {performanceData.stats.pending_maintenances} pending
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performance Data Loaded Successfully
                    </CardTitle>
                    <CardDescription>
                        Data for {drive.name} (ID: {drive.id})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Statistics:</h4>
                            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
                                {JSON.stringify(performanceData.stats, null, 2)}
                            </pre>
                        </div>
                        
                        <div>
                            <h4 className="font-medium mb-2">Recent Issues ({performanceData.recent_issues.length}):</h4>
                            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
                                {JSON.stringify(performanceData.recent_issues, null, 2)}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 