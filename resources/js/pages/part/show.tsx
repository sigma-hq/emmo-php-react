import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CpuIcon, ArrowLeft, Link2Icon, UnlinkIcon, Clock, CheckCircle2, InfoIcon, ClipboardList, CalendarIcon, CircleAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
}

interface User {
    id: number;
    name: string;
}

interface Part {
    id: number;
    name: string;
    part_ref: string;
    status: 'attached' | 'unattached';
    drive_id: number | null;
    drive?: Drive | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface PartAttachmentHistory {
    id: number;
    part_id: number;
    drive_id: number | null;
    action: 'attached' | 'detached';
    notes: string | null;
    user_id: number | null;
    created_at: string;
    updated_at: string;
    drive?: Drive | null;
    user?: User | null;
}

interface PartShowProps {
    part: Part;
    attachmentHistory: PartAttachmentHistory[];
}

export default function PartShow({ part, attachmentHistory }: PartShowProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;
    
    // Calculate pagination
    const totalPages = Math.ceil(attachmentHistory.length / recordsPerPage);
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = attachmentHistory.slice(indexOfFirstRecord, indexOfLastRecord);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Parts',
            href: '/parts',
        },
        {
            title: part.name,
            href: route('api.parts.show', part.id),
        },
    ];

    // Format date helper function
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    };

    // Format time helper function
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };
    
    // Pagination controls
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${part.name} - Part Details`} />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Hero Header with Background */}
                <div className="relative bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] rounded-xl overflow-hidden shadow-lg">
                    <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
                    <div className="relative p-6 sm:p-8 text-white">
                        <div className="mb-4 flex justify-between items-start">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-full h-8 gap-1 bg-white/20 border-transparent hover:bg-white/30 text-white backdrop-blur-sm"
                            >
                                <Link href="/parts">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back</span>
                                </Link>
                            </Button>
                            
                            <Button
                                asChild
                                className="rounded-full h-8 gap-1 bg-white/20 hover:bg-white/30 border-transparent text-white backdrop-blur-sm"
                            >
                                <Link href={route('api.parts.edit', part.id)}>
                                    <span>Edit Part</span>
                                </Link>
                            </Button>
                        </div>
                        
                        <div className="sm:flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                                    <CpuIcon className="h-8 w-8 text-white" />
                                </div>
                                
                                <div>
                                    <div className="mb-1">
                                        <h1 className="text-2xl sm:text-3xl font-bold">{part.name}</h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-white/30 hover:bg-white/40 text-white">
                                                {part.part_ref}
                                            </Badge>
                                            
                                            <Badge className={part.status === 'attached' 
                                                ? 'bg-green-500/70 hover:bg-green-500/80 text-white'
                                                : 'bg-gray-500/70 hover:bg-gray-500/80 text-white'}>
                                                {part.status === 'attached' ? (
                                                    <Link2Icon className="mr-1 h-3 w-3" />
                                                ) : (
                                                    <UnlinkIcon className="mr-1 h-3 w-3" />
                                                )}
                                                {part.status === 'attached' ? 'Attached' : 'Unattached'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    {part.drive && (
                                        <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                            <Link2Icon className="h-4 w-4 mr-2" />
                                            <span>Connected to drive:</span>
                                            <Link
                                                href={route('api.drives.show', part.drive.id)}
                                                className="ml-2 font-medium hover:underline"
                                            >
                                                {part.drive.name} <span className="opacity-70">({part.drive.drive_ref})</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Part Details & History */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Info Cards - Now Direct Stat Boxes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900">
                                <div className="flex items-center gap-2 text-[var(--emmo-green-primary)] mb-2">
                                    <InfoIcon className="h-5 w-5" />
                                    <h3 className="text-base font-medium">Status</h3>
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium ${
                                    part.status === 'attached'
                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                    {part.status === 'attached' ? (
                                        <>
                                            <Link2Icon className="h-4 w-4" /> 
                                            Connected
                                        </>
                                    ) : (
                                        <>
                                            <UnlinkIcon className="h-4 w-4" /> 
                                            Not Connected
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900">
                                <div className="flex items-center gap-2 text-[var(--emmo-green-primary)] mb-2">
                                    <Clock className="h-5 w-5" />
                                    <h3 className="text-base font-medium">Created</h3>
                                </div>
                                <div className="text-sm font-medium">{formatDate(part.created_at)}</div>
                                <div className="text-xs text-gray-500">{formatTime(part.created_at)}</div>
                            </div>
                            
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900">
                                <div className="flex items-center gap-2 text-[var(--emmo-green-primary)] mb-2">
                                    <CalendarIcon className="h-5 w-5" />
                                    <h3 className="text-base font-medium">Last Update</h3>
                                </div>
                                <div className="text-sm font-medium">{formatDate(part.updated_at)}</div>
                                <div className="text-xs text-gray-500">{formatTime(part.updated_at)}</div>
                            </div>
                        </div>
                        
                        {/* Part Information - Now Direct Panel */}
                        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                            <div className="border-b border-gray-100 dark:border-gray-800 p-5">
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                    <h2 className="text-lg font-medium">Part Information</h2>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Details and specifications</p>
                            </div>
                            <div className="p-5">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h3>
                                        {part.notes ? (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
                                                {part.notes}
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 italic">
                                                No description available
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Part Reference</h3>
                                            <p className="font-medium">{part.part_ref}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Attached To</h3>
                                            {part.drive ? (
                                                <Link 
                                                    href={route('api.drives.show', part.drive.id)}
                                                    className="font-medium text-[var(--emmo-green-primary)] hover:underline"
                                                >
                                                    {part.drive.name} ({part.drive.drive_ref})
                                                </Link>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400 italic">Not attached to any drive</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Attachment History - Simplified Table with Pagination */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                    <h2 className="text-lg font-medium">Attachment History</h2>
                                </div>
                                
                                {attachmentHistory.length > 0 && (
                                    <Badge variant="outline">
                                        {attachmentHistory.length} records
                                    </Badge>
                                )}
                            </div>
                            
                            {attachmentHistory.length === 0 ? (
                                <div className="py-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                    <CircleAlert className="h-5 w-5 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No attachment history found for this part.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[100px]">Date</TableHead>
                                                    <TableHead className="w-[100px]">Action</TableHead>
                                                    <TableHead>Drive</TableHead>
                                                    <TableHead className="w-[150px]">User</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {currentRecords.map((record) => (
                                                    <TableRow key={record.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <TableCell className="py-3">
                                                            <div className="font-medium text-xs">{formatDate(record.created_at)}</div>
                                                            <div className="text-xs text-gray-500">{formatTime(record.created_at)}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={record.action === 'attached'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                                            }>
                                                                {record.action === 'attached' ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Link2Icon className="h-3 w-3" /> 
                                                                        ATTACHED
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <UnlinkIcon className="h-3 w-3" /> 
                                                                        DETACHED
                                                                    </div>
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {record.drive ? (
                                                                <Link 
                                                                    href={route('api.drives.show', record.drive.id)}
                                                                    className="font-medium text-[var(--emmo-green-primary)] hover:underline text-sm"
                                                                >
                                                                    {record.drive.name} 
                                                                    <span className="text-xs text-gray-500 ml-1">
                                                                        ({record.drive.drive_ref})
                                                                    </span>
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-500 text-sm">—</span>
                                                            )}
                                                            
                                                            {record.notes && (
                                                                <div className="hidden group-hover:block mt-1.5 p-2 text-xs bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                                                                    {record.notes}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                                        {record.user 
                                                                            ? record.user.name.split(' ').map(n => n[0]).join('')
                                                                            : 'S'
                                                                        }
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                    {record.user ? record.user.name : 'System'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    
                                    {attachmentHistory.length > recordsPerPage && (
                                        <div className="flex items-center justify-between mt-3 px-1">
                                            <div className="text-xs text-gray-500">
                                                Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, attachmentHistory.length)} of {attachmentHistory.length} records
                                            </div>
                                            <div className="flex gap-1">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-7 w-7 p-0"
                                                    disabled={currentPage === 1}
                                                    onClick={() => goToPage(currentPage - 1)}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    <span className="sr-only">Previous</span>
                                                </Button>
                                                
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <Button
                                                        key={i}
                                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                                        size="sm"
                                                        className={`h-7 w-7 p-0 ${currentPage === i + 1 ? 'bg-[var(--emmo-green-primary)]' : ''}`}
                                                        onClick={() => goToPage(i + 1)}
                                                    >
                                                        {i + 1}
                                                    </Button>
                                                ))}
                                                
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-7 w-7 p-0"
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => goToPage(currentPage + 1)}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                    <span className="sr-only">Next</span>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Right Column - Status & Quick Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Status Info - Now Direct Panel */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                            <div className={`h-2 ${
                                part.status === 'attached' 
                                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}>
                            </div>
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-lg font-medium">Current Status</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Connection status and related drive</p>
                            </div>
                            <div className="p-5">
                                <div className="space-y-6">
                                    <div className={`flex items-center gap-3 p-4 rounded-lg ${
                                        part.status === 'attached' 
                                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                                            : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            part.status === 'attached'
                                                ? 'bg-green-100 dark:bg-green-800/30'
                                                : 'bg-gray-200 dark:bg-gray-800'
                                            }`}>
                                            {part.status === 'attached' ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : (
                                                <UnlinkIcon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {part.status === 'attached' 
                                                    ? 'Attached to Drive' 
                                                    : 'Not Attached'
                                                }
                                            </div>
                                            <div className="text-sm opacity-80">
                                                {part.status === 'attached'
                                                    ? 'This part is connected to a drive'
                                                    : 'This part is not connected to any drive'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {part.drive && (
                                        <div className="p-4 rounded-lg border border-[var(--emmo-green-light)] bg-[var(--emmo-green-light)]/10">
                                            <h3 className="font-medium mb-2 flex items-center gap-2 text-[var(--emmo-green-primary)]">
                                                <Link2Icon className="h-4 w-4" />
                                                Connected Drive
                                            </h3>
                                            <Link
                                                href={route('api.drives.show', part.drive.id)}
                                                className="block p-3 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="font-medium">{part.drive.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Reference: {part.drive.drive_ref}
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        <Button
                                            className="w-full bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                                            asChild
                                        >
                                            <Link href={route('api.parts.edit', part.id)}>
                                                {part.status === 'attached'
                                                    ? 'Change Attachment' 
                                                    : 'Attach to Drive'
                                                }
                                            </Link>
                                        </Button>
                                        
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            asChild
                                        >
                                            <Link href="/parts">
                                                Back to Parts List
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 