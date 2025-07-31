import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, PlusIcon, ClipboardCheck, Check, ChevronRight, ChevronLeft, Clipboard, X, ChevronsUpDown, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, router } from '@inertiajs/react';
import { format as formatDateFns } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
}

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';

interface ChecklistItem {
    id: string;
    text: string;
    status: 'pending' | 'completed' | 'failed';
    notes?: string | null;
    updated_at?: string | null;
}

interface Maintenance {
    id: number;
    drive_id: number;
    title: string;
    description: string | null;
    maintenance_date: string;
    technician: string | null; // This maps to the database field, but we'll show "Operator" in UI
    status: MaintenanceStatus;
    cost: number | null;
    parts_replaced: { id: number; name: string }[] | null;
    checklist_json?: string;
}

interface LogMaintenanceDialogProps {
    drive: Drive;
    operators: { id: number; name: string }[];
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSuccess: (message: string) => void;
    statusConfig: { 
        key: MaintenanceStatus; 
        label: string; 
        icon: React.ElementType, 
        colorClass: string,
        bgClass: string,
        iconColorClass: string 
    }[];
    editingMaintenance?: Maintenance | null;
    clearEditingMaintenance: () => void;
}

export default function LogMaintenanceDialog({ 
    drive, 
    operators, 
    isOpen, 
    setIsOpen, 
    onSuccess,
    statusConfig,
    editingMaintenance,
    clearEditingMaintenance
}: LogMaintenanceDialogProps) {
    const [formStep, setFormStep] = useState(1);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [isTechComboOpen, setIsTechComboOpen] = useState(false);
    const [techSearchTerm, setTechSearchTerm] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        drive_id: drive.id.toString(),
        title: '',
        description: '',
        maintenance_date: formatDateFns(new Date(), 'yyyy-MM-dd'),
        technician: '',
        status: 'pending' as MaintenanceStatus,
        cost: 0,
        parts_replaced: [] as { id: number; name: string }[],
        checklist_json: '[]'
    });
    
    const wasOpen = useRef(isOpen);

    useEffect(() => {
        if (isOpen) {
            if (editingMaintenance) {
                setData({
                    drive_id: editingMaintenance.drive_id.toString(),
                    title: editingMaintenance.title,
                    description: editingMaintenance.description || '',
                    maintenance_date: editingMaintenance.maintenance_date ? formatDateFns(new Date(editingMaintenance.maintenance_date), 'yyyy-MM-dd') : formatDateFns(new Date(), 'yyyy-MM-dd'),
                    technician: editingMaintenance.technician || '',
                    status: editingMaintenance.status,
                    cost: editingMaintenance.cost || 0,
                    parts_replaced: editingMaintenance.parts_replaced || [],
                    checklist_json: editingMaintenance.checklist_json || '[]'
                });
                try {
                    setChecklistItems(editingMaintenance.checklist_json ? JSON.parse(editingMaintenance.checklist_json) : []);
                } catch (e) {
                    console.error("Failed to parse checklist JSON:", e);
                    setChecklistItems([]);
                }
                setFormStep(1); // Reset to first step for editing
            } else {
                reset(); // Reset form for new entry
                setData('drive_id', drive.id.toString());
                setData('maintenance_date', formatDateFns(new Date(), 'yyyy-MM-dd'));
                setData('status', 'pending');
                setChecklistItems([]);
                setFormStep(1);
            }
        }
        // Only clear editing state when dialog transitions from open to closed
        if (wasOpen.current && !isOpen) {
            clearEditingMaintenance();
        }
        wasOpen.current = isOpen;
    }, [isOpen, editingMaintenance, drive.id, reset, setData, clearEditingMaintenance]);
    
    useEffect(() => {
        setData('checklist_json', JSON.stringify(checklistItems));
    }, [checklistItems]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as any, value);
    };
    
    const handleSelectChange = (name: string, value: string) => {
        setData(name as any, value as MaintenanceStatus);
    };

    const addChecklistItem = () => {
        if (!newChecklistItem.trim()) return;
        const newItem: ChecklistItem = { 
            id: Date.now().toString(), 
            text: newChecklistItem.trim(), 
            status: 'pending',
            notes: null,
            updated_at: new Date().toISOString()
        };
        setChecklistItems(prev => [...prev, newItem]);
        setNewChecklistItem('');
    };
    
    const toggleChecklistItem = (id: string) => {
        setChecklistItems(prev => prev.map(item => {
            if (item.id === id) {
                // Cycle through statuses: pending -> completed -> failed -> pending
                let newStatus: 'pending' | 'completed' | 'failed';
                switch (item.status) {
                    case 'pending': newStatus = 'completed'; break;
                    case 'completed': newStatus = 'failed'; break;
                    default: newStatus = 'pending';
                }
                return { ...item, status: newStatus, updated_at: new Date().toISOString() };
            }
            return item;
        }));
    };

    const updateChecklistItemNotes = (id: string, notes: string) => {
        setChecklistItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, notes, updated_at: new Date().toISOString() };
            }
            return item;
        }));
    };
    
    const removeChecklistItem = (id: string) => {
        setChecklistItems(prev => prev.filter(item => item.id !== id));
    };
    
    const nextStep = () => {
        if (formStep === 1 && (!data.title || !data.maintenance_date)) return;
        setFormStep(prev => prev + 1);
    };
    
    const prevStep = () => setFormStep(prev => prev - 1);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = !!editingMaintenance;
        const url = isEditing 
            ? route('api.maintenances.update', editingMaintenance!.id)
            : route('api.maintenances.store');
        
        const options = {
            onSuccess: () => {
                const successMsg = isEditing 
                    ? 'Maintenance record updated successfully' 
                    : 'Maintenance record added successfully';
                onSuccess(successMsg);
                setIsOpen(false);
                // Resetting form state is handled by useEffect on isOpen change
            },
            onError: (formErrors: any) => console.error(`Error ${isEditing ? 'updating' : 'adding'} maintenance:`, formErrors),
            preserveState: true, // Preserve scroll position etc.
            preserveScroll: true,
        };

        if (isEditing) {
            router.put(url, data, options);
        } else {
            post(url, options);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <DialogHeader className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                        <DialogTitle className="text-2xl font-bold mb-2">
                            {editingMaintenance ? 'Edit Maintenance Record' : 'Log New Maintenance'}
                        </DialogTitle>
                        <DialogDescription className="text-white/80 max-w-sm">
                            {formStep === 1 ? `Step 1: Basic details for ${drive.name} (${drive.drive_ref})` : `Step 2: Maintenance checklist`}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {formStep === 1 ? (
                            <div className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-medium block">Title <span className="text-red-500">*</span></Label>
                                    <Input id="title" name="title" value={data.title} onChange={handleInputChange} placeholder="Maintenance title" required />
                                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                                </div>
                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium block">Description</Label>
                                    <textarea id="description" name="description" value={data.description} onChange={handleInputChange} className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]" placeholder="Describe the maintenance performed" />
                                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                </div>
                                {/* Date & Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="maintenance_date" className="text-sm font-medium block">Date <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn("w-full justify-start text-left font-normal", !data.maintenance_date && "text-muted-foreground")}
                                                onClick={() => setIsDatePickerOpen(true)}
                                            >
                                                {data.maintenance_date
                                                    ? formatDateFns(new Date(data.maintenance_date), 'PPP')
                                                    : "Pick a date"}
                                            </Button>
                                            {isDatePickerOpen && (
                                                <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden">
                                                    <ShadcnCalendar
                                                        mode="single"
                                                        selected={data.maintenance_date ? new Date(data.maintenance_date) : undefined}
                                                        onSelect={date => {
                                                            if (date) {
                                                                const formatted = formatDateFns(date, 'yyyy-MM-dd');
                                                                setData('maintenance_date', formatted);
                                                                setIsDatePickerOpen(false);
                                                            }
                                                        }}
                                                        initialFocus
                                                    />
                                                </div>
                                            )}
                                            {/* Overlay to close dropdown */}
                                            {isDatePickerOpen && (
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setIsDatePickerOpen(false)}
                                                />
                                            )}
                                        </div>
                                        {errors.maintenance_date && <p className="text-red-500 text-sm mt-1">{errors.maintenance_date}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-sm font-medium block">Status <span className="text-red-500">*</span></Label>
                                        <Select value={data.status} onValueChange={(value) => handleSelectChange('status', value)} disabled={checklistItems.length > 0}>
                                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                {statusConfig.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {checklistItems.length > 0 && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                <span className="inline-block w-1 h-1 bg-current rounded-full"></span>
                                                Status will be automatically managed based on task completion
                                            </p>
                                        )}
                                        {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                                    </div>
                                </div>
                                                    {/* Operator (Custom Combobox) */}
                    <div className="space-y-2">
                        <Label htmlFor="technician" className="text-sm font-medium block">Operator</Label>
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsTechComboOpen(true)}
                                            className="w-full justify-between"
                                        >
                                                                        {data.technician
                                ? operators.find(op => op.name === data.technician)?.name || data.technician
                                : "Select operator..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                        {isTechComboOpen && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden">
                                                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                    <Input
                                                        type="text"
                                                        placeholder="Search operators..."
                                                        className="w-full"
                                                        value={techSearchTerm}
                                                        onChange={(e) => setTechSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[220px] overflow-y-auto p-1">
                                                    {operators
                                                        .filter(op => op.name.toLowerCase().includes(techSearchTerm.toLowerCase()))
                                                        .map(op => (
                                                            <button
                                                                key={op.id}
                                                                type="button"
                                                                className={cn(
                                                                    "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                                                                    data.technician === op.name && "bg-[var(--emmo-green-light)] dark:bg-[var(--emmo-green-dark)]/20"
                                                                )}
                                                                onClick={() => {
                                                                    setData('technician', op.name);
                                                                    setIsTechComboOpen(false);
                                                                    setTechSearchTerm('');
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        data.technician === op.name ? "opacity-100 text-[var(--emmo-green-primary)]" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="font-medium">{op.name}</span>
                                                            </button>
                                                        ))}
                                                    {operators.filter(op => op.name.toLowerCase().includes(techSearchTerm.toLowerCase())).length === 0 && (
                                                        <div className="px-2 py-4 text-center text-sm text-gray-500">
                                                            No operators found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/* Overlay to close dropdown */}
                                        {isTechComboOpen && (
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => {
                                                    setIsTechComboOpen(false);
                                                    setTechSearchTerm('');
                                                }}
                                            />
                                        )}
                                    </div>
                                    {errors.technician && <p className="text-red-500 text-sm mt-1">{errors.technician}</p>}
                                </div>
                            </div>
                        ) : ( // Step 2: Checklist
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ClipboardCheck className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                    <h3 className="text-lg font-medium">Maintenance Checklist</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Add checklist item" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); }}} />
                                    <Button type="button" onClick={addChecklistItem} className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]">Add</Button>
                                </div>
                                {checklistItems.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                        <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No checklist items added yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                        {checklistItems.map((item) => (
                                            <div key={item.id} className="flex flex-col p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleChecklistItem(item.id)}
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                            item.status === 'completed' 
                                                                ? 'bg-green-500 border-green-500 text-white' 
                                                                : item.status === 'failed'
                                                                ? 'bg-red-500 border-red-500 text-white'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    >
                                                        {item.status === 'completed' && <Check className="h-3 w-3" />}
                                                        {item.status === 'failed' && <X className="h-3 w-3" />}
                                                    </button>
                                                    <span className={`flex-1 ${
                                                        item.status === 'completed' 
                                                            ? 'line-through text-gray-400' 
                                                            : item.status === 'failed'
                                                            ? 'text-red-500 dark:text-red-400'
                                                            : ''
                                                    }`}>
                                                        {item.text}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-gray-500">
                                                            {item.updated_at ? formatDateFns(new Date(item.updated_at), 'MMM d, h:mm a') : ''}
                                                        </span>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => removeChecklistItem(item.id)} 
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {/* Notes input field */}
                                                <div className="mt-2 pl-8">
                                                    <Input 
                                                        type="text"
                                                        value={item.notes || ''}
                                                        onChange={(e) => updateChecklistItemNotes(item.id, e.target.value)}
                                                        placeholder="Add notes for this task..."
                                                        className="text-sm h-8 px-2 py-1"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-between gap-3 bg-gray-50 dark:bg-gray-950">
                        {formStep === 1 ? (
                            <>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-gray-200 dark:border-gray-800">Cancel</Button>
                                <Button type="button" onClick={(e) => { e.preventDefault(); nextStep(); }} disabled={!data.title || !data.maintenance_date} className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] transition-colors px-5">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
                            </>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); prevStep(); }} className="border-gray-200 dark:border-gray-800"><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
                                <Button type="submit" disabled={processing} className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] transition-colors px-5">
                                    {processing ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing</>
                                    ) : editingMaintenance ? 'Save Changes' : 'Save Maintenance Record'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 