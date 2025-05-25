import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    Clipboard, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Plus, 
    X, 
    Check, 
    AlertCircle, 
    Trash,
    PencilLine 
} from 'lucide-react';
import { format } from 'date-fns';
import { useForm, router, usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ChecklistItemStatus = 'pending' | 'completed' | 'failed';

interface ChecklistItem {
    id: string;
    text: string;
    status: ChecklistItemStatus;
    notes?: string | null;
    updated_at?: string | null;
}

interface MaintenanceChecklistProps {
    maintenanceId: number;
    checklistItems: ChecklistItem[];
    onUpdate?: (stats: any) => void;
    readOnly?: boolean;
}

interface ChecklistStats {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    completion_percentage: number;
}

// Define the API response data structure
interface ApiResponse {
    success: boolean;
    message: string;
    maintenance?: {
        id: number;
        checklist_json: ChecklistItem[];
        [key: string]: any;
    };
    stats?: ChecklistStats;
}

// We'll use 'any' for type safety here to avoid TypeScript errors 
// with Inertia's response structure
// This is a compromise for the sake of our implementation
type InertiaCallback = (page: any) => void;

export default function MaintenanceChecklist({ 
    maintenanceId, 
    checklistItems = [], 
    onUpdate,
    readOnly = false 
}: MaintenanceChecklistProps) {
    const [items, setItems] = useState<ChecklistItem[]>(checklistItems);
    const [newItemText, setNewItemText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
    const [editNotes, setEditNotes] = useState('');
    
    // Get flash messages from Inertia
    const { flash } = usePage<any>().props;
    
    // Forms for Inertia
    const addItemForm = useForm({
        text: '',
        status: 'pending' as ChecklistItemStatus,
        notes: null as string | null
    });
    
    const updateItemForm = useForm({
        status: '' as ChecklistItemStatus,
        notes: null as string | null
    });
    
    // Update items when prop changes
    useEffect(() => {
        setItems(checklistItems);
    }, [checklistItems]);
    
    // Show success message temporarily
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);
    
    // Filter items based on active tab
    const filteredItems = items.filter(item => {
        if (activeTab === 'all') return true;
        return item.status === activeTab;
    });
    
    // Calculate stats
    const stats: ChecklistStats = {
        total: items.length,
        completed: items.filter(item => item.status === 'completed').length,
        failed: items.filter(item => item.status === 'failed').length,
        pending: items.filter(item => item.status === 'pending').length,
        completion_percentage: items.length > 0 
            ? Math.round((items.filter(item => item.status === 'completed').length / items.length) * 100) 
            : 0
    };
    
    // Add a new checklist item
    const handleAddItem = async () => {
        if (!newItemText.trim() || readOnly || addItemForm.processing) return;
        
        addItemForm.setData('text', newItemText.trim());
        
        addItemForm.post(route('api.maintenances.checklist.add', maintenanceId), {
            preserveScroll: true,
            onSuccess: () => {
                setNewItemText('');
                addItemForm.reset();
                // The page will automatically refresh with new data
            }
        });
    };
    
    // Update a checklist item status
    const handleUpdateStatus = async (id: string, status: ChecklistItemStatus) => {
        if (readOnly || updateItemForm.processing) return;
        
        updateItemForm.setData({
            status: status,
            notes: null
        });
        
        updateItemForm.put(route('api.maintenances.checklist.update', { maintenance: maintenanceId, itemId: id }), {
            preserveScroll: true,
            onSuccess: () => {
                updateItemForm.reset();
                // The page will automatically refresh with new data
            }
        });
    };
    
    // Delete a checklist item
    const handleDeleteItem = async (id: string) => {
        if (readOnly) return;
        
        router.delete(route('api.maintenances.checklist.remove', { maintenance: maintenanceId, itemId: id }), {
            preserveScroll: true
            // The page will automatically refresh with new data
        });
    };
    
    // Open the edit notes dialog
    const openEditDialog = (item: ChecklistItem) => {
        if (readOnly) return;
        
        setEditingItem(item);
        setEditNotes(item.notes || '');
        setIsDialogOpen(true);
    };
    
    // Save notes
    const handleSaveNotes = async () => {
        if (!editingItem || readOnly || updateItemForm.processing) return;
        
        updateItemForm.setData({
            status: '' as ChecklistItemStatus, // Empty string means don't update status
            notes: editNotes
        });
        
        updateItemForm.put(route('api.maintenances.checklist.update', { maintenance: maintenanceId, itemId: editingItem.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                updateItemForm.reset();
                // The page will automatically refresh with new data
            }
        });
    };
    
    // Get status icon
    const getStatusIcon = (status: ChecklistItemStatus) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };
    
    // Get status class
    const getStatusClass = (status: ChecklistItemStatus) => {
        switch (status) {
            case 'completed':
                return 'line-through text-gray-400';
            case 'failed':
                return 'text-red-500';
            default:
                return '';
        }
    };
    
    // Render
    return (
        <div className="space-y-4">
            {/* Header with tabs and stats */}
            <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                    <TabsList className="grid grid-cols-4 w-auto">
                        <TabsTrigger value="all" className="text-xs px-2 py-1">
                            All ({stats.total})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs px-2 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending ({stats.pending})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="text-xs px-2 py-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed ({stats.completed})
                        </TabsTrigger>
                        <TabsTrigger value="failed" className="text-xs px-2 py-1">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed ({stats.failed})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                
                <div className="text-sm font-medium">
                    {stats.completion_percentage}% Complete
                </div>
            </div>
            
            {/* Error and success messages */}
            {error && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            
            {success && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}
            
            {/* Add new item form (if not read-only) */}
            {!readOnly && (
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Add a new task..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddItem();
                            }
                        }}
                        disabled={addItemForm.processing}
                        className="flex-1"
                    />
                    <Button 
                        onClick={handleAddItem} 
                        disabled={addItemForm.processing || !newItemText.trim()}
                        size="sm"
                        className="h-9 bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            )}
            
            {/* Checklist items */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                    <Clipboard className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {activeTab === 'all'
                            ? 'No tasks added yet.'
                            : `No ${activeTab} tasks.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {filteredItems.map((item) => (
                        <div 
                            key={item.id} 
                            className="group flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            {/* Status toggle buttons (if not read-only) */}
                            {!readOnly ? (
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(item.id, 'completed')}
                                        disabled={updateItemForm.processing}
                                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                            item.status === 'completed' 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-green-100 hover:text-green-500'
                                        }`}
                                        title="Mark as completed"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(item.id, 'failed')}
                                        disabled={updateItemForm.processing}
                                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                            item.status === 'failed' 
                                                ? 'bg-red-500 text-white' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-red-100 hover:text-red-500'
                                        }`}
                                        title="Mark as failed"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(item.id, 'pending')}
                                        disabled={updateItemForm.processing}
                                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                            item.status === 'pending' 
                                                ? 'bg-gray-500 text-white' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-300 hover:text-gray-700'
                                        }`}
                                        title="Mark as pending"
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                // Status indicator for read-only mode
                                <div className="h-6 w-6 flex items-center justify-center">
                                    {getStatusIcon(item.status)}
                                </div>
                            )}
                            
                            {/* Task text and notes */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${getStatusClass(item.status)}`}>
                                    {item.text}
                                </div>
                                {item.notes && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                        {item.notes}
                                    </div>
                                )}
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                                {/* Date display */}
                                {item.updated_at && (
                                    <span className="text-xs text-gray-400 hidden sm:inline-block">
                                        {format(new Date(item.updated_at), 'MMM d, h:mm a')}
                                    </span>
                                )}
                                
                                {!readOnly && (
                                    <>
                                        {/* Edit notes button */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(item)}
                                            className="h-7 w-7 p-0 opacity-50 group-hover:opacity-100"
                                            title="Edit notes"
                                        >
                                            <PencilLine className="h-3.5 w-3.5" />
                                        </Button>
                                        
                                        {/* Delete button */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="h-7 w-7 p-0 text-red-500 opacity-50 group-hover:opacity-100"
                                            title="Delete task"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Edit notes dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Task Notes</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            value={editNotes || ''}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes about this task..."
                            className="min-h-[120px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveNotes}
                            disabled={updateItemForm.processing}
                            className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                        >
                            Save Notes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 