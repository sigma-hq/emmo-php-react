import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { CpuIcon, ArrowLeft, Link2Icon, UnlinkIcon, Clock, CheckCircle2, InfoIcon, ClipboardList, CalendarIcon, CircleAlert, ChevronLeft, ChevronRight, FileText, Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

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
    drives: Drive[];
}

export default function PartShow({ part, attachmentHistory, drives }: PartShowProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;
    
    // Add dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [driveComboboxOpen, setDriveComboboxOpen] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form for attachment change
    const { data, setData, put, processing, errors, reset } = useForm({
        status: part.status,
        drive_id: part.drive_id ? part.drive_id.toString() : '',
        attachment_notes: '',
    });
    
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
    
    // Handle status change
    const handleStatusChange = (status: 'attached' | 'unattached') => {
        setData('status', status);
        if (status === 'unattached') {
            setData('drive_id', '');
        }
    };
    
    // Get selected drive name
    const getSelectedDriveName = () => {
        if (!data.drive_id) return null;
        const drivesList = drives || [];
        const selectedDrive = drivesList.find(drive => drive.id.toString() === data.drive_id);
        return selectedDrive ? `${selectedDrive.name} (${selectedDrive.drive_ref})` : null;
    };
    
    // Open attachment dialog
    const openAttachmentDialog = () => {
        reset();
        setData({
            status: part.status,
            drive_id: part.drive_id ? part.drive_id.toString() : '',
            attachment_notes: '',
        });
        setIsDialogOpen(true);
    };
    
    // Handle form submission for attachment changes only
    const handleAttachmentChange = (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('Updating attachment status with:', {
            status: data.status,
            drive_id: data.drive_id,
            attachment_notes: data.attachment_notes
        });
        
        // Use the dedicated attachment update endpoint
        router.post(route('api.parts.update-attachment', part.id), {
            status: data.status,
            drive_id: data.status === 'attached' ? data.drive_id : null,
            attachment_notes: data.attachment_notes,
        }, {
            onSuccess: (response) => {
                console.log('Attachment update successful', response);
                setIsDialogOpen(false);
                setShowSuccessMessage(true);
                setSuccessMessage(
                    data.status === 'attached' 
                        ? data.drive_id === (part.drive_id?.toString() || '')
                            ? 'Part attachment unchanged' 
                            : 'Part successfully attached to drive'
                        : 'Part successfully detached from drive'
                );
                
                setTimeout(() => {
                    setShowSuccessMessage(false);
                }, 3000);
                
                // Refresh the page to show updated data
                router.visit(route('api.parts.show', part.id), {
                    preserveScroll: true,
                    preserveState: false
                });
            },
            onError: (errors) => {
                console.error('Attachment update error:', errors);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${part.name} - Part Details`} />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Success Message */}
                {showSuccessMessage && (
                    <div className="fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out">
                        <div className="flex items-center gap-3 bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow-lg">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">{successMessage}</p>
                            <button 
                                onClick={() => setShowSuccessMessage(false)}
                                className="ml-2 text-white hover:text-gray-200 transition-colors"
                            >
                                <CircleAlert className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            
                {/* Header - Redesigned to match Drive details page */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-full h-8 gap-1"
                            >
                                <Link href="/parts">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                        <div className="flex gap-4 items-center">
                            <div className="bg-[var(--emmo-green-light)] p-4 rounded-full">
                                <CpuIcon className="h-8 w-8 text-[var(--emmo-green-primary)]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold">{part.name}</h1>
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                        {part.part_ref}
                                    </div>
                                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        part.status === 'attached' 
                                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800' 
                                            : 'bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                    }`}>
                                        {part.status === 'attached' ? (
                                            <>
                                                <Link2Icon className="h-3 w-3" />
                                                Attached
                                            </>
                                        ) : (
                                            <>
                                                <UnlinkIcon className="h-3 w-3" />
                                                Unattached
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    {part.status === 'attached' && part.drive 
                                        ? `Connected to ${part.drive.name} (${part.drive.drive_ref})` 
                                        : 'Not connected to any drive'}
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
                                <Link href={`mailto:?subject=Part Details: ${part.name}&body=Part Reference: ${part.part_ref}%0D%0AStatus: ${part.status}%0D%0ANotes: ${part.notes || 'None'}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Share
                                </Link>
                            </Button>
                            <Button
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] h-9"
                                asChild
                            >
                                <Link href={route('api.parts.edit', part.id)}>
                                    Edit Part
                                </Link>
                            </Button>
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
                                            onClick={openAttachmentDialog}
                                        >
                                                {part.status === 'attached'
                                                    ? 'Change Attachment' 
                                                    : 'Attach to Drive'
                                                }
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
                
                {/* Change Attachment Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Attachment Status</DialogTitle>
                            <DialogDescription>
                                Change attachment status for this part.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAttachmentChange} className="space-y-6">
                            {/* Form content */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium block">
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <RadioGroup 
                                    value={data.status}
                                    onValueChange={(value) => handleStatusChange(value as 'attached' | 'unattached')}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="unattached" id="unattached" />
                                        <Label htmlFor="unattached" className="cursor-pointer flex items-center gap-1">
                                            <UnlinkIcon className="h-3.5 w-3.5" />
                                            Unattached
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="attached" id="attached" />
                                        <Label htmlFor="attached" className="cursor-pointer flex items-center gap-1">
                                            <Link2Icon className="h-3.5 w-3.5" />
                                            Attached to Drive
                                        </Label>
                                    </div>
                                </RadioGroup>
                                {errors.status && (
                                    <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                                )}
                            </div>
                            
                            {/* Drive Selection Combobox - Only shown when "Attached" is selected */}
                            {data.status === 'attached' && (
                                <div className="space-y-3">
                                    <Label htmlFor="drive_id" className="text-sm font-medium block">
                                        Select Drive <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setDriveComboboxOpen(true)}
                                            className="w-full justify-between"
                                        >
                                            {data.drive_id
                                                ? getSelectedDriveName()
                                                : "Select drive..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>

                                        {driveComboboxOpen && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden">
                                                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                    <Input
                                                        type="text"
                                                        placeholder="Search drives..."
                                                        className="w-full"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[220px] overflow-y-auto p-1">
                                                    {(drives || [])
                                                        .filter(drive =>
                                                            drive.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            drive.drive_ref.toLowerCase().includes(searchTerm.toLowerCase())
                                                        )
                                                        .map(drive => (
                                                            <button
                                                                key={drive.id}
                                                                type="button"
                                                                className={cn(
                                                                    "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                                                                    data.drive_id === drive.id.toString() && "bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20"
                                                                )}
                                                                onClick={() => {
                                                                    setData('drive_id', drive.id.toString());
                                                                    setDriveComboboxOpen(false);
                                                                    setSearchTerm('');
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        data.drive_id === drive.id.toString() ? "opacity-100 text-[var(--emmo-green-primary)]" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="font-medium">{drive.name}</span>
                                                                <span className="ml-2 text-xs text-gray-500">({drive.drive_ref})</span>
                                                            </button>
                                                        ))}
                                                    {(drives || [])
                                                        .filter(drive =>
                                                            drive.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            drive.drive_ref.toLowerCase().includes(searchTerm.toLowerCase())
                                                        ).length === 0 && (
                                                            <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                                No drives found
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Overlay to close dropdown */}
                                        {driveComboboxOpen && (
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => {
                                                    setDriveComboboxOpen(false);
                                                    setSearchTerm('');
                                                }}
                                            />
                                        )}
                                    </div>
                                    {errors.drive_id && (
                                        <p className="text-red-500 text-sm mt-1">{errors.drive_id}</p>
                                    )}
                                </div>
                            )}
                            
                            {/* Attachment Notes */}
                            <div className="space-y-3">
                                <Label htmlFor="attachment_notes" className="text-sm font-medium block">
                                    Notes about this change
                                </Label>
                                <textarea
                                    id="attachment_notes"
                                    value={data.attachment_notes}
                                    onChange={(e) => setData('attachment_notes', e.target.value)}
                                    className="w-full min-h-[80px] p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]"
                                    placeholder="Reason for changing attachment status (will be recorded in history)"
                                />
                            </div>
                            
                            {/* Footer with actions */}
                            <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="border-gray-200 dark:border-gray-800"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing || (data.status === 'attached' && !data.drive_id)} 
                                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] transition-colors px-5"
                                >
                                    {processing ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            Save Changes
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
} 