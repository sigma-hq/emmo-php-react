import React from 'react';
import { Calendar, MapPin, FileText, Zap, CpuIcon, ClockIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    notes: string | null;
    parts: any[];
    created_at: string;
    updated_at: string;
}

interface OverviewTabProps {
    drive: Drive;
    failedInspections?: any[];
    pendingMaintenances?: any[];
    operationalStatus?: 'operational' | 'needs_attention';
    hasAlerts?: boolean;
}

export default function OverviewTab({ drive, failedInspections = [], pendingMaintenances = [], operationalStatus = 'operational', hasAlerts = false }: OverviewTabProps) {
    const partsCount = drive.parts.length;
    
    return (
        <div className="min-h-full">
            {/* Modern two-column layout */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left column (65%) - Main content */}
                <div className="w-full lg:w-7/12 space-y-8">
                    {/* Large status indicator box */}
                    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm ${
                        operationalStatus === 'operational' 
                            ? 'bg-gradient-to-r from-[var(--emmo-green-light)] to-[var(--emmo-green-primary)]/20' 
                            : 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20'
                    }`}>
                        <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden">
                            <svg className="absolute -right-6 -top-6 h-40 w-40 opacity-10" viewBox="0 0 24 24" fill="none">
                                <path d="M15 19.5L7.5 12L15 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="flex items-center mb-2">
                            <div className={`flex-shrink-0 h-3 w-3 rounded-full mr-2 ${
                                operationalStatus === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                            <h3 className={`text-lg font-semibold ${
                                operationalStatus === 'operational' 
                                    ? 'text-[var(--emmo-green-dark)]' 
                                    : 'text-yellow-800 dark:text-yellow-200'
                            }`}>
                                {operationalStatus === 'operational' ? 'Operational' : 'Needs Attention'}
                            </h3>
                        </div>
                        <p className={`text-sm max-w-md ${
                            operationalStatus === 'operational' 
                                ? 'text-[var(--emmo-green-dark)]/80' 
                                : 'text-yellow-800/80 dark:text-yellow-200/80'
                        }`}>
                            {operationalStatus === 'operational' 
                                ? 'This drive is currently functioning normally with no pending alerts or maintenance issues.'
                                : `This drive has ${failedInspections.length} failed inspection${failedInspections.length !== 1 ? 's' : ''} and ${pendingMaintenances.length} pending maintenance${pendingMaintenances.length !== 1 ? 's' : ''} that require attention.`
                            }
                        </p>
                        <div className={`mt-6 flex items-center justify-between ${
                            operationalStatus === 'operational' 
                                ? 'text-[var(--emmo-green-dark)]/90' 
                                : 'text-yellow-800/90 dark:text-yellow-200/90'
                        }`}>
                            <div className="text-sm">
                                <span className="block font-medium">Failed Inspections</span>
                                <span className="text-xs">{failedInspections.length}</span>
                            </div>
                            <div className="text-sm">
                                <span className="block font-medium">Pending Maintenance</span>
                                <span className="text-xs">{pendingMaintenances.length}</span>
                            </div>
                            <div className="text-sm">
                                <span className="block font-medium">Status</span>
                                <span className="text-xs">{operationalStatus === 'operational' ? 'Healthy' : 'Needs Attention'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Notes section with visual elements */}
                    <div className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Last updated: {format(new Date(drive.updated_at), 'MMM d, yyyy')}
                            </span>
                        </div>
                        
                        {drive.notes ? (
                            <div className="bg-gray-50 dark:bg-gray-900/30 p-5 rounded-lg border-l-4 border-[var(--emmo-green-primary)] shadow-inner">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                    {drive.notes}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-6 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-center">
                                    No notes have been added for this drive yet.
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Alerts and Issues Section */}
                    {hasAlerts && (
                        <div className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Issues</h3>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Failed Inspections */}
                                {failedInspections.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Failed Inspections ({failedInspections.length})</h4>
                                        <div className="space-y-2">
                                            {failedInspections.slice(0, 3).map((inspection, index) => (
                                                <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-400">
                                                    <div className="text-sm font-medium text-red-800 dark:text-red-200">
                                                        {inspection.task?.name || 'Unknown Task'}
                                                    </div>
                                                    <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                                                        Failed by: {inspection.performer?.name || 'Unknown'} • {format(new Date(inspection.created_at), 'MMM d, yyyy')}
                                                    </div>
                                                    {inspection.notes && (
                                                        <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                                                            Notes: {inspection.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {failedInspections.length > 3 && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    +{failedInspections.length - 3} more failed inspections
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Pending Maintenance */}
                                {pendingMaintenances.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pending Maintenance ({pendingMaintenances.length})</h4>
                                        <div className="space-y-2">
                                            {pendingMaintenances.slice(0, 3).map((maintenance, index) => (
                                                <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-400">
                                                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                        {maintenance.title}
                                                    </div>
                                                    <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                                                        Created by: {maintenance.user?.name || 'Unknown'} • {format(new Date(maintenance.created_at), 'MMM d, yyyy')}
                                                    </div>
                                                    {maintenance.created_from_inspection && (
                                                        <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                                                            Auto-created from failed inspection
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {pendingMaintenances.length > 3 && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    +{pendingMaintenances.length - 3} more pending maintenance tasks
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Activity Timeline Placeholder */}
                    <div className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-4">
                            <ClockIcon className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="relative pl-8 pb-5 border-l-2 border-dashed border-gray-200 dark:border-gray-800">
                                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500"></div>
                                <div className="text-sm">
                                    <div className="font-medium text-gray-900 dark:text-white">Drive created</div>
                                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                        {format(new Date(drive.created_at), 'MMMM d, yyyy')} at {format(new Date(drive.created_at), 'h:mm a')}
                                    </div>
                                </div>
                            </div>
                            
                            {partsCount > 0 && (
                                <div className="relative pl-8 border-l-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[var(--emmo-green-primary)]"></div>
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {partsCount} {partsCount === 1 ? 'part' : 'parts'} attached
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                            Latest on {format(new Date(), 'MMMM d, yyyy')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right column (35%) - Sidebar */}
                <div className="w-full lg:w-5/12 space-y-8">
                    {/* Drive Information Box */}
                    <div className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Drive Details</h3>
                            </div>
                            <div className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                {drive.drive_ref}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-800">
                                <MapPin className="h-4 w-4 text-[var(--emmo-green-primary)] mr-3" />
                                <div className="flex justify-between w-full">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</span>
                                    <span className="text-sm text-gray-900 dark:text-white">{drive.location || 'Not specified'}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-800">
                                <Calendar className="h-4 w-4 text-[var(--emmo-green-primary)] mr-3" />
                                <div className="flex justify-between w-full">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</span>
                                    <span className="text-sm text-gray-900 dark:text-white">{format(new Date(drive.created_at), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center py-2">
                                <CpuIcon className="h-4 w-4 text-[var(--emmo-green-primary)] mr-3" />
                                <div className="flex justify-between w-full">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Parts Count</span>
                                    <span className="text-sm text-gray-900 dark:text-white">{partsCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Parts Preview Box */}
                    <div className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CpuIcon className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attached Parts</h3>
                            </div>
                            <div className="bg-[var(--emmo-green-light)] text-[var(--emmo-green-primary)] text-xs font-medium px-2.5 py-1 rounded-full">
                                {partsCount} {partsCount === 1 ? 'part' : 'parts'}
                            </div>
                        </div>
                        
                        {partsCount > 0 ? (
                            <div className="space-y-3">
                                {drive.parts.slice(0, 4).map((part, index) => (
                                    <div 
                                        key={part.id} 
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                                <CpuIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-gray-900 dark:text-white">{part.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{part.part_ref}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                            Attached
                                        </div>
                                    </div>
                                ))}
                                
                                {partsCount > 4 && (
                                    <div className="text-center py-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg mt-2">
                                        <span className="text-sm text-[var(--emmo-green-primary)]">
                                            + {partsCount - 4} more parts
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                    <CpuIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                                    No parts attached to this drive
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 