import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, PlusIcon, CheckCircle2, Clock, X, List } from 'lucide-react';
import { format } from 'date-fns';
import LogMaintenanceDialog from './log-maintenance-dialog';
import MaintenanceListView from './maintenance-list-view';
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
    created_at: string;
    updated_at: string;
}

interface MaintenanceTabProps {
    drive: Drive;
    operators: { id: number; name: string }[];
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

export default function MaintenanceTab({ drive, operators }: MaintenanceTabProps) {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
    const [deletingMaintenanceId, setDeletingMaintenanceId] = useState<number | null>(null);
    const wasDeleteOpen = useRef(false);
    
    useEffect(() => {
        fetchMaintenances();
    }, [drive.id]);
    
    useEffect(() => {
        if (wasDeleteOpen.current && deletingMaintenanceId === null) {
            // Only clear or reset things here if needed
        }
        wasDeleteOpen.current = deletingMaintenanceId !== null;
    }, [deletingMaintenanceId]);
    
    const fetchMaintenances = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('api.drives.maintenances', drive.id));
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setMaintenances(data);
        } catch (error) {
            console.error('Failed to fetch maintenances:', error);
            setMaintenances([]); // Set to empty array on error
        } finally {
            setIsLoading(false);
        }
    };
    
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
            fetchMaintenances();
        }
    };
    
    const handleMaintenanceSuccess = (message: string) => {
        fetchMaintenances();
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--emmo-green-primary)] mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading maintenance records...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Success Message */}
            {showSuccessMessage && (
                <div className="bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow flex items-center gap-2 fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-5">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{successMessage}</span>
                    <button onClick={() => setShowSuccessMessage(false)} className="ml-2 text-white/80 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                    <span>Maintenance List</span>
                </h2>
                <div className="flex items-center gap-2">
                    {/* Add Maintenance Button */}
                    <Button 
                        className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                        onClick={() => {
                            setEditingMaintenance(null); // Ensure not in edit mode when opening for add
                            setIsAddDialogOpen(true);
                        }}
                    >
                        <PlusIcon className="h-4 w-4 mr-2" /> 
                        Log Maintenance
                    </Button>
                </div>
            </div>

            {/* List View Component */}
            <MaintenanceListView
                drive={drive}
                maintenances={maintenances}
                statusConfig={statusConfig}
                onOpenAddDialog={() => {
                    setEditingMaintenance(null);
                    setIsAddDialogOpen(true);
                }}
                onStatusUpdate={handleUpdateStatus}
                onEditMaintenance={handleOpenEditDialog}
                onDeleteMaintenance={handleDeleteConfirmation}
            />
            
            {/* Log Maintenance Dialog (handles both add and edit) */}
            <LogMaintenanceDialog 
                drive={drive}
                operators={operators}
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
                onSuccess={(message) => handleMaintenanceSuccess(message)}
                statusConfig={statusConfig}
                editingMaintenance={editingMaintenance}
                clearEditingMaintenance={() => setEditingMaintenance(null)}
            />

            {/* Delete Confirmation Dialog */}
            {deletingMaintenanceId !== null && (
                <AlertDialog
                    open={deletingMaintenanceId !== null}
                    onOpenChange={open => {
                        if (!open) setDeletingMaintenanceId(null);
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the maintenance record.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeletingMaintenanceId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={actuallyDeleteMaintenance} 
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                            > 
                                Yes, delete it
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
} 