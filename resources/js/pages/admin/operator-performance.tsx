import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, Users, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';

interface OperatorPerformance {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    total_inspections_assigned: number;
    completed_inspections: number;
    failed_inspections: number;
    pending_inspections: number;
    completion_rate: number;
    pass_rate: number;
    last_activity_at: string | null;
    days_since_last_activity: number;
    performance_score: number;
    status: 'active' | 'warning' | 'critical' | 'inactive';
    notes: string;
    period_start: string;
    period_end: string;
}

interface PerformanceSummary {
    total_operators: number;
    active_operators: number;
    warning_operators: number;
    critical_operators: number;
    inactive_operators: number;
    average_performance_score: number;
    average_completion_rate: number;
    average_pass_rate: number;
}

interface PerformanceTrend {
    date: string;
    day: string;
    average_score: number;
    average_completion_rate: number;
    active_operators: number;
    warning_operators: number;
    critical_operators: number;
    inactive_operators: number;
}

interface Props {
    performances: OperatorPerformance[];
    usersNeedingAttention: OperatorPerformance[];
    summary: PerformanceSummary;
    trends: PerformanceTrend[];
}

export default function OperatorPerformancePage({ performances, usersNeedingAttention, summary, trends }: Props) {
    const [isTriggeringCheck, setIsTriggeringCheck] = useState(false);

    const triggerPerformanceCheck = async () => {
        setIsTriggeringCheck(true);
        try {
            const response = await fetch('/admin/operator-performance/trigger-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            
            if (response.ok) {
                window.location.reload();
            } else {
                alert('Failed to trigger performance check');
            }
        } catch (error) {
            console.error('Error triggering performance check:', error);
            alert('Error triggering performance check');
        } finally {
            setIsTriggeringCheck(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'critical':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'inactive':
                return <Clock className="h-4 w-4 text-gray-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'warning':
                return 'secondary';
            case 'critical':
                return 'destructive';
            case 'inactive':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AppLayout>
            <Head title="Operator Performance Monitoring" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Operator Performance Monitoring</h1>
                        <p className="text-muted-foreground">
                            Track operator performance and identify issues that need attention
                        </p>
                    </div>
                    <Button 
                        onClick={triggerPerformanceCheck}
                        disabled={isTriggeringCheck}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isTriggeringCheck ? 'Checking...' : 'Run Performance Check'}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Operators</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_operators}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Operators</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{summary.active_operators}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Warning Level</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{summary.warning_operators}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Critical Level</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{summary.critical_operators}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Metrics */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Average Performance Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">
                                {summary.average_performance_score?.toFixed(1) || 0}%
                            </div>
                            <Progress value={summary.average_performance_score || 0} className="mt-2" />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Average Completion Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {summary.average_completion_rate?.toFixed(1) || 0}%
                            </div>
                            <Progress value={summary.average_completion_rate || 0} className="mt-2" />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Average Pass Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-600">
                                {summary.average_pass_rate?.toFixed(1) || 0}%
                            </div>
                            <Progress value={summary.average_pass_rate || 0} className="mt-2" />
                        </CardContent>
                    </Card>
                </div>

                {/* Users Needing Attention */}
                {usersNeedingAttention.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="h-5 w-5" />
                                Operators Needing Attention ({usersNeedingAttention.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {usersNeedingAttention.map((performance) => (
                                    <div key={performance.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(performance.status)}
                                            <div>
                                                <div className="font-medium text-red-900">{performance.user.name}</div>
                                                <div className="text-sm text-red-700">{performance.notes}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={getStatusBadgeVariant(performance.status)}>
                                                {performance.status.toUpperCase()}
                                            </Badge>
                                            <div className="text-sm text-red-700 mt-1">
                                                Score: {performance.performance_score}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operator Performance Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Operator</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Performance Score</TableHead>
                                    <TableHead>Completion Rate</TableHead>
                                    <TableHead>Pass Rate</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                    <TableHead>Inspections</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {performances.map((performance) => (
                                    <TableRow key={performance.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{performance.user.name}</div>
                                                <div className="text-sm text-muted-foreground">{performance.user.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(performance.status)}
                                                <Badge variant={getStatusBadgeVariant(performance.status)}>
                                                    {performance.status}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{performance.performance_score}%</span>
                                                <Progress value={performance.performance_score} className="w-20" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{performance.completion_rate}%</span>
                                                <Progress value={performance.completion_rate} className="w-20" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{performance.pass_rate}%</span>
                                                <Progress value={performance.pass_rate} className="w-20" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {performance.last_activity_at ? (
                                                <div className="text-sm">
                                                    <div>{formatDate(performance.last_activity_at)}</div>
                                                    <div className="text-muted-foreground">
                                                        {performance.days_since_last_activity} days ago
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">No activity</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>Total: {performance.total_inspections_assigned}</div>
                                                <div className="text-green-600">✓ {performance.completed_inspections}</div>
                                                <div className="text-red-600">✗ {performance.failed_inspections}</div>
                                                <div className="text-yellow-600">⏳ {performance.pending_inspections}</div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
