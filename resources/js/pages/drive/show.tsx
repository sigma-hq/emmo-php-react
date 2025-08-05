import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { HardDrive, ArrowLeft, FileText, CpuIcon, ClipboardList, Wrench, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './tabs/overview-tab';
import PartsTab from './tabs/parts-tab';
import InspectionsTab from './tabs/inspections-tab';
import MaintenanceTab from './tabs/maintenance-tab';
import PerformanceTab from './tabs/performance-tab';

interface Part {
    id: number;
    name: string;
    part_ref: string;
    status: 'attached' | 'unattached';
    drive_id: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    notes: string | null;
    parts: Part[];
    created_at: string;
    updated_at: string;
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

interface DriveShowProps {
    drive: Drive;
    operators: { id: number; name: string }[];
    isAdmin?: boolean;
    failedInspections?: any[];
    pendingMaintenances?: any[];
    operationalStatus?: 'operational' | 'needs_attention';
    hasAlerts?: boolean;
}

export default function DriveShow({ drive, operators, isAdmin, failedInspections, pendingMaintenances, operationalStatus, hasAlerts }: DriveShowProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [performanceData, setPerformanceData] = useState<DrivePerformance | null>(null);
    const [loadingPerformance, setLoadingPerformance] = useState(false);

    // Simple performance data fetch
    useEffect(() => {
        if (activeTab === 'performance' && !performanceData && !loadingPerformance) {
            setLoadingPerformance(true);
            fetch(`/api/drives/${drive.id}/performance`)
                .then(response => response.json())
                .then(data => {
                    setPerformanceData(data);
                })
                .catch(error => {
                    console.error('Failed to fetch drive performance:', error);
                })
                .finally(() => {
                    setLoadingPerformance(false);
                });
        }
    }, [activeTab, drive.id, performanceData, loadingPerformance]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Drive',
            href: '/drive',
        },
        {
            title: drive.name,
            href: route('api.drives.show', drive.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${drive.name} - Drive Details`} />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-full h-8 gap-1"
                            >
                                <Link href="/drive">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                        <div className="flex gap-4 items-center">
                            <div className="bg-[var(--emmo-green-light)] p-4 rounded-full">
                                <HardDrive className="h-8 w-8 text-[var(--emmo-green-primary)]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold">{drive.name}</h1>
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                        {drive.drive_ref}
                                    </div>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    {drive.location || 'No location specified'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-9"
                            >
                                <Link href={`mailto:?subject=Drive Details: ${drive.name}&body=Drive Reference: ${drive.drive_ref}%0D%0ALocation: ${drive.location || 'Not specified'}%0D%0ANotes: ${drive.notes || 'None'}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Share
                                </Link>
                            </Button>
                            {isAdmin && (
                                <Button
                                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] h-9"
                                    asChild
                                >
                                                                    <Link href={`/drives/${drive.id}/edit`}>
                                    Edit Drive
                                </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            <span>Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="parts" className="flex items-center gap-2">
                            <CpuIcon className="h-4 w-4" />
                            <span>Parts</span>
                            {drive.parts.length > 0 && (
                                <span className="ml-1.5 bg-[var(--emmo-green-primary)] text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {drive.parts.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="inspections" className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            <span>Inspections</span>
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            <span>Maintenance</span>
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>Performance</span>
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6 flex-1">
                        <TabsContent value="overview" className="h-full">
                            <OverviewTab 
                                drive={drive} 
                                failedInspections={failedInspections}
                                pendingMaintenances={pendingMaintenances}
                                operationalStatus={operationalStatus}
                                hasAlerts={hasAlerts}
                            />
                        </TabsContent>
                        
                        <TabsContent value="parts" className="h-full">
                            <PartsTab drive={drive} />
                        </TabsContent>
                        
                        <TabsContent value="inspections" className="h-full">
                            <InspectionsTab drive={drive} />
                        </TabsContent>
                        
                        <TabsContent value="maintenance" className="h-full">
                            <MaintenanceTab drive={drive} operators={operators} isAdmin={isAdmin} />
                        </TabsContent>
                        
                        <TabsContent value="performance" className="h-full">
                            <PerformanceTab 
                                drive={drive} 
                                performanceData={performanceData} 
                                loading={loadingPerformance} 
                                isAdmin={isAdmin} 
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </AppLayout>
    );
} 