import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, Wrench, Calendar, User, Clock, GripVertical, MoveHorizontal, CheckCircle2, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
}

interface MaintenanceListProps {
    drive: Drive;
    maintenances: Maintenance[];
    statusConfig: { 
        key: MaintenanceStatus; 
        label: string; 
        icon: React.ElementType, 
        colorClass: string,
        bgClass: string,
        iconColorClass: string 
    }[];
    onOpenAddDialog: () => void;
    onStatusUpdate: (maintenanceId: number, newStatus: MaintenanceStatus) => Promise<void>;
    onEditMaintenance: (maintenance: Maintenance) => void;
    onDeleteMaintenance: (maintenanceId: number) => void;
}

// Create a sortable maintenance card component
function SortableMaintenanceCard({ maintenance, formatDate, formatCurrency, getStatusBadge, onEditMaintenance, onDeleteMaintenance }: { 
    maintenance: Maintenance, 
    formatDate: (date: string | null) => string,
    formatCurrency: (amount: number | null) => string,
    getStatusBadge: (status: MaintenanceStatus) => React.ReactElement,
    onEditMaintenance: (maintenance: Maintenance) => void;
    onDeleteMaintenance: (maintenanceId: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: maintenance.id.toString(),
        data: {
            type: 'maintenance',
            maintenance
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card 
                className="bg-white dark:bg-gray-850 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:-translate-y-0.5 group"
            >
                <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start gap-1">
                        <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 text-gray-800 dark:text-gray-200 flex-1">
                            {maintenance.title}
                        </CardTitle>
                        <div className="flex gap-1 items-center">
                            {getStatusBadge(maintenance.status)}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => onEditMaintenance(maintenance)}>
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteMaintenance(maintenance.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-700/20 dark:focus:text-red-500">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <GripVertical className="h-5 w-5 text-gray-300 dark:text-gray-600 opacity-50 group-hover:opacity-100 cursor-grab" />
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="px-3 py-1 text-xs">
                    {maintenance.description && (
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {maintenance.description}
                        </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-1 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(maintenance.maintenance_date)}</span>
                        </div>
                        
                        {maintenance.technician && (
                            <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[100px]">{maintenance.technician}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
                
                <CardFooter className="p-3 pt-2 border-t border-gray-100 dark:border-gray-800/50 flex justify-between items-center">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(maintenance.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                        {(() => {
                            try {
                                if (!maintenance.checklist_json) return 0;
                                
                                const checklist = typeof maintenance.checklist_json === 'string' 
                                    ? JSON.parse(maintenance.checklist_json) 
                                    : maintenance.checklist_json;
                                    
                                return Array.isArray(checklist) ? checklist.length : 0;
                            } catch (e) {
                                return 0;
                            }
                        })()} tasks
                        </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function MaintenanceList({ 
    drive, 
    maintenances, 
    statusConfig,
    onOpenAddDialog,
    onStatusUpdate,
    onEditMaintenance,
    onDeleteMaintenance
}: MaintenanceListProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Configure DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Only start dragging after moving 5px
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const getStatusBadge = (status: MaintenanceStatus) => {
        const config = statusConfig.find(s => s.key === status) || statusConfig[0];
        
        return (
            <span 
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${config.bgClass} ${config.iconColorClass}`}
            >
                <config.icon className="h-3 w-3" />
                <span>{config.label}</span>
            </span>
        );
    };
    
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        try {
            return format(new Date(dateStr), 'MMM d, yyyy');
        } catch (e) { return dateStr; }
    };
    
    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return '—';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const groupedMaintenances = useMemo(() => {
        return maintenances.reduce((acc, maintenance) => {
            (acc[maintenance.status] = acc[maintenance.status] || []).push(maintenance);
            return acc;
        }, {} as Record<MaintenanceStatus, Maintenance[]>);
    }, [maintenances]);

    // Find the active item being dragged
    const activeItem = useMemo(() => {
        if (!activeId) return null;
        
        return maintenances.find(m => m.id.toString() === activeId) || null;
    }, [activeId, maintenances]);
    
    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id.toString());
    };
    
    // Handle drag end
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        
        setActiveId(null);
        
        if (!over) return;
        
        // Get the target column
        const targetColumnId = over.id.toString();
        
        // If target is a column (not another card)
        if (targetColumnId.startsWith('column-')) {
            const newStatus = targetColumnId.replace('column-', '') as MaintenanceStatus;
            const maintenanceId = parseInt(active.id.toString());
            
            // Get the current maintenance
            const maintenance = maintenances.find(m => m.id === maintenanceId);
            
            // Only update if status is different
            if (maintenance && maintenance.status !== newStatus && !isUpdating) {
                setIsUpdating(true);
                try {
                    await onStatusUpdate(maintenanceId, newStatus);
                } finally {
                    setIsUpdating(false);
                }
            }
        }
    };
    
    // Handle drag over
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        
        if (!over) return;
        
        // Get the source and target IDs
        const activeId = active.id.toString();
        const overId = over.id.toString();
        
        // Skip if source and target are the same
        if (activeId === overId) return;
    };

    if (maintenances.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm mb-5">
                    <Wrench className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                    No maintenance records
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                    Log your first maintenance task to see it on the board.
                </p>
                <Button 
                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                    onClick={onOpenAddDialog}
                >
                    <PlusIcon className="h-4 w-4 mr-2" /> 
                    Create First Task
                </Button>
            </div>
        );
    }
    
    return (
        <div className="fixed-kanban">
            <div className="kanban-tip text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                <MoveHorizontal className="h-3.5 w-3.5" />
                <span>Drag tasks between columns to update their status</span>
            </div>
            
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <div className="kanban-board flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {statusConfig.map(({ key, label, icon: Icon, colorClass, bgClass, iconColorClass }) => (
                        <div 
                            key={key} 
                            id={`column-${key}`} 
                            className={`kanban-column flex-shrink-0 w-[350px] lg:w-[380px] rounded-xl ${bgClass} shadow-sm h-full`}
                        >
                            {/* Column Header */}
                            <div className={`px-3 py-3 border-b ${colorClass} flex justify-between items-center sticky top-0 z-10 ${bgClass} backdrop-blur-sm bg-opacity-90 rounded-t-xl`}>
                                <div className="flex items-center gap-2">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${bgClass.replace('bg-', 'bg-opacity-80 bg-')}`}>
                                        <Icon className={`h-4.5 w-4.5 ${iconColorClass}`} />
                                    </div>
                                    <h3 className="font-medium text-gray-800 dark:text-gray-100 text-md">{label}</h3>
                                </div>
                                <Badge variant="secondary" className={`${iconColorClass.replace('text-', 'bg-')} bg-opacity-15 text-xs font-semibold px-2`}>
                                    {groupedMaintenances[key]?.length || 0}
                                </Badge>
                            </div>

                            {/* Cards Container */}
                            <div className="kanban-cards p-3 space-y-3 min-h-[calc(100vh-260px)] max-h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600">
                                <SortableContext 
                                    items={(groupedMaintenances[key] || []).map(m => m.id.toString())}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {/* List of Cards */}
                                    {(groupedMaintenances[key] || []).map(maintenance => (
                                        <SortableMaintenanceCard 
                                            key={maintenance.id}
                                            maintenance={maintenance}
                                            formatDate={formatDate}
                                            formatCurrency={formatCurrency}
                                            getStatusBadge={getStatusBadge}
                                            onEditMaintenance={onEditMaintenance}
                                            onDeleteMaintenance={onDeleteMaintenance}
                                        />
                                    ))}
                                </SortableContext>
                                
                                {/* Empty State */}
                                {(!groupedMaintenances[key] || groupedMaintenances[key].length === 0) && (
                                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-900/20 p-4">
                                        <div className={`h-10 w-10 rounded-full ${bgClass} flex items-center justify-center mb-2`}>
                                            <Icon className={`h-5 w-5 ${iconColorClass} opacity-70`} />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                            Drag tasks here
                                        </p>
                                    </div>
                                )}
                                
                                {/* Add Task Button (only in the first column) */}
                                {key === 'pending' && (
                                    <button 
                                        onClick={onOpenAddDialog}
                                        className="w-full mt-3 p-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:text-[var(--emmo-green-primary)] hover:border-[var(--emmo-green-primary)] dark:hover:border-[var(--emmo-green-primary)] transition-colors text-sm flex items-center justify-center gap-1.5"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        <span>Add Task</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeItem ? (
                            <Card 
                                className="bg-white dark:bg-gray-850 shadow-lg rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 w-[350px] opacity-90"
                            >
                                <CardHeader className="p-3 pb-2">
                                    <div className="flex justify-between items-start gap-1">
                                        <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 text-gray-800 dark:text-gray-200">
                                            {activeItem.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-1">
                                            {getStatusBadge(activeItem.status)}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ) : null}
                    </DragOverlay>
                </div>
            </DndContext>
        </div>
    );
} 