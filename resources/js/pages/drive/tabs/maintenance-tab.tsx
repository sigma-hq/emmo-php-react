import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, PlusIcon, CheckCircle2, Clock, X, List } from 'lucide-react';
import { format } from 'date-fns';
import LogMaintenanceDialog from './log-maintenance-dialog';
import MaintenanceListView from './maintenance-list-view';
import { usePage } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Part {
    id: number;
    name: string;
    part_ref: string;
}

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';

interface Maintenance {
    id: number;
    drive_id: number;
    title: string;
    description: string | null;
    maintenance_date: string;
    technician: string | null;
    status: MaintenanceStatus;
    cost: number | null;
    parts_replaced: Part[] | null;
    user_id: number | null;
    user?: {
        id: number;
        name: string;
    };
    checklist_json?: string;
    created_at: string;
    updated_at: string;
}

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    notes: string | null;
    parts: any[];
    maintenances: Maintenance[];
    created_at: string;
    updated_at: string;
}

interface MaintenanceTabProps {
    drive: Drive;
    operators: { id: number; name: string }[];
    isAdmin?: boolean;
}

// Status configuration for the Kanban board
const statusConfig = [
    { 
        key: 'pending' as MaintenanceStatus, 
        label: 'To Do', 
        icon: Clock, 
        colorClass: "border-amber-400", 
        bgClass: "bg-amber-50 dark:bg-amber-900/10",
        iconColorClass: "text-amber-500" 
    },
    { 
        key: 'in_progress' as MaintenanceStatus, 
        label: 'In Progress', 
        icon: Wrench, 
        colorClass: "border-blue-400", 
        bgClass: "bg-blue-50 dark:bg-blue-900/10",
        iconColorClass: "text-blue-500" 
    },
    { 
        key: 'completed' as MaintenanceStatus, 
        label: 'Completed', 
        icon: CheckCircle2, 
        colorClass: "border-emerald-400", 
        bgClass: "bg-emerald-50 dark:bg-emerald-900/10",
        iconColorClass: "text-emerald-500" 
    },
];

export default function MaintenanceTab({ drive, operators, isAdmin }: MaintenanceTabProps) {
    const [maintenances, setMaintenances] = useState<Maintenance[]>(drive.maintenances || []);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
    const [deletingMaintenanceId, setDeletingMaintenanceId] = useState<number | null>(null);
    const wasDeleteOpen = useRef(false);
    
    // Get flash messages from Inertia
    const { flash } = usePage<any>().props;
    
    // Update maintenances when drive prop changes (after Inertia updates)
    useEffect(() => {
        setMaintenances(drive.maintenances || []);
    }, [drive.maintenances]);
    
    // Handle flash messages from the backend
    useEffect(() => {
        if (flash && flash.success) {
            setSuccessMessage(flash.success);
            setShowSuccessMessage(true);
            
            // Auto-hide the notification after 3 seconds
            const timer = setTimeout(() => {
                setShowSuccessMessage(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [flash]);
    
    useEffect(() => {
        if (wasDeleteOpen.current && deletingMaintenanceId === null) {
            // Only clear or reset things here if needed
        }
        wasDeleteOpen.current = deletingMaintenanceId !== null;
    }, [deletingMaintenanceId]);
    
    // Handle status update when a maintenance is moved to a different column
    const handleUpdateStatus = async (maintenanceId: number, newStatus: MaintenanceStatus) => {
        try {
            const response = await fetch(route('api.maintenances.update', maintenanceId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            
            // Optimistically update the UI
            setMaintenances(maintenances.map(m => 
                m.id === maintenanceId ? { ...m, status: newStatus } : m
            ));
            
            // Show success message
            setSuccessMessage('Status updated successfully');
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
        } catch (error) {
            console.error('Error updating status:', error);
            // Refresh data from server in case of error
            window.location.reload();
        }
    };
    
    const handleMaintenanceSuccess = (message: string) => {
        // The page will be refreshed by Inertia, so we don't need to manually fetch
        setSuccessMessage(message);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        setEditingMaintenance(null); // Clear editing state
    };

    const handleOpenEditDialog = (maintenance: Maintenance) => {
        setEditingMaintenance(maintenance);
        setIsAddDialogOpen(true);
    };

    const handleDeleteConfirmation = (maintenanceId: number) => {
        setDeletingMaintenanceId(maintenanceId);
    };

    const actuallyDeleteMaintenance = async () => {
        if (deletingMaintenanceId === null) return;

        try {
            // Note: Ensure your backend route for deletion is defined, e.g., api.maintenances.destroy
            const response = await fetch(route('api.maintenances.destroy', deletingMaintenanceId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete maintenance record.');
            }
            
            handleMaintenanceSuccess('Maintenance record deleted successfully');
            setMaintenances(prev => prev.filter(m => m.id !== deletingMaintenanceId));
        } catch (error: any) {
            console.error('Error deleting maintenance:', error);
            setSuccessMessage(`Error: ${error.message || 'Could not delete record.'}`);
            setShowSuccessMessage(true); // Show error as a success message for now, or implement error specific alert
            setTimeout(() => setShowSuccessMessage(false), 5000);
        } finally {
            setDeletingMaintenanceId(null);
        }
    };

    const cancelDelete = () => {
        setDeletingMaintenanceId(null);
    };
    
    return (
        <div className="space-y-6">
            {/* Success Notification */}
            {showSuccessMessage && (
                <div className="fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out">
                    <div className="flex items-center gap-3 bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow-lg">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <p className="font-medium">{successMessage}</p>
                        <button 
                            onClick={() => setShowSuccessMessage(false)}
                            className="ml-2 text-white hover:text-gray-200 transition-colors"
                        >
                        <X className="h-4 w-4" />
                    </button>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Wrench className="h-6 w-6 text-[var(--emmo-green-primary)]" />
                    <h2 className="text-xl font-semibold">Maintenance Records</h2>
                </div>
                {isAdmin && (
                    <Button 
                        onClick={() => {
                        setEditingMaintenance(null);
                            setIsAddDialogOpen(true);
                        }}
                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" /> 
                        Log Maintenance
                    </Button>
                )}
            </div>

            {/* Content */}
            <MaintenanceListView
                drive={drive}
                maintenances={maintenances}
                onOpenAddDialog={() => {
                    setEditingMaintenance(null);
                    setIsAddDialogOpen(true);
                }}
                onStatusUpdate={handleUpdateStatus}
                onEditMaintenance={handleOpenEditDialog}
                onDeleteMaintenance={handleDeleteConfirmation}
                statusConfig={statusConfig}
                isAdmin={isAdmin}
            />
            
            {/* Log Maintenance Dialog */}
            <LogMaintenanceDialog 
                drive={drive}
                operators={operators}
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
                onSuccess={handleMaintenanceSuccess}
                statusConfig={statusConfig}
                editingMaintenance={editingMaintenance}
                clearEditingMaintenance={() => setEditingMaintenance(null)}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deletingMaintenanceId !== null} onOpenChange={cancelDelete}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the maintenance record
                            and remove all associated data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={actuallyDeleteMaintenance} 
                            className="bg-red-600 hover:bg-red-700"
                            > 
                            Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
        </div>
    );
} 