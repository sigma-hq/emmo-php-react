import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CpuIcon, Search, PlusIcon, Pencil, Trash2, Link2Icon, UnlinkIcon, CheckCircle2, X } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

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

interface PartsTabProps {
    drive: Drive;
}

export default function PartsTab({ drive }: PartsTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    
    // Filter parts based on search term
    const filteredParts = drive.parts.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_ref.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Example function to handle part detachment (would need backend implementation)
    const handleDetachPart = (partId: number) => {
        // This would be replaced with an actual API call
        console.log('Detaching part:', partId);
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
    };
    
    return (
        <div className="space-y-6">
            {/* Success Message */}
            {showSuccessMessage && (
                <div className="bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow flex items-center gap-2 absolute top-6 right-6 z-50 animate-in fade-in slide-in-from-top-5">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Part successfully detached</span>
                    <button 
                        onClick={() => setShowSuccessMessage(false)}
                        className="ml-2 text-white/80 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            
            {/* Header with search and actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search parts..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => setSearchTerm('')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        className="h-9 gap-1"
                        asChild
                    >
                        <Link href={route('parts')}>
                            <CpuIcon className="h-4 w-4" />
                            <span>All Parts</span>
                        </Link>
                    </Button>
                    
                    <Button 
                        className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] h-9 gap-1"
                        asChild
                    >
                        <Link href={route('parts', { preselect_drive: drive.id })}>
                            <PlusIcon className="h-4 w-4" />
                            <span>Add Part</span>
                        </Link>
                    </Button>
                </div>
            </div>
            
            {/* Parts List */}
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-lg overflow-hidden">
                <div className="border-b border-gray-100 dark:border-gray-800 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CpuIcon className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                            <h2 className="text-lg font-medium">Connected Parts</h2>
                        </div>
                        {filteredParts.length > 0 && (
                            <div className="bg-[var(--emmo-green-light)] text-[var(--emmo-green-primary)] text-xs font-medium px-2.5 py-1 rounded-full">
                                {filteredParts.length} {filteredParts.length === 1 ? 'part' : 'parts'}
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {searchTerm ? `Search results for "${searchTerm}"` : 'Parts attached to this drive'}
                    </p>
                </div>
                
                {filteredParts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Name</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Reference</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Notes</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-right px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParts.map((part, index) => (
                                    <tr 
                                        key={part.id} 
                                        className={`relative group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-sm">
                                            <Link 
                                                href={route('api.parts.show', part.id)}
                                                className="font-medium text-gray-900 dark:text-white hover:text-[var(--emmo-green-primary)] hover:underline transition-colors flex items-center gap-1"
                                            >
                                                {part.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                                                {part.part_ref}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800">
                                                <Link2Icon className="h-3 w-3" /> Attached
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {part.notes ? (
                                                <div className="group relative">
                                                    <p className="truncate max-w-[250px]">{part.notes}</p>
                                                    {part.notes.length > 30 && (
                                                        <div className="hidden group-hover:block absolute left-0 top-full mt-1 p-3 bg-white dark:bg-gray-800 shadow-lg rounded z-10 max-w-sm">
                                                            {part.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="invisible group-hover:visible flex justify-end gap-3 items-center">
                                                <Link
                                                    href={route('api.parts.show', part.id)}
                                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                                    title="View part details"
                                                >
                                                    <CpuIcon className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    href={route('api.parts.edit', part.id)}
                                                    className="text-[var(--emmo-green-primary)] hover:text-[var(--emmo-green-dark)] transition-colors"
                                                    title="Edit part"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDetachPart(part.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Detach from this drive"
                                                >
                                                    <UnlinkIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900/50 mb-4">
                                <CpuIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                {searchTerm ? 'No matching parts found' : 'No parts attached'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                                {searchTerm
                                    ? `No parts matching "${searchTerm}" are attached to this drive.`
                                    : `This drive currently doesn't have any parts attached to it.`}
                            </p>
                            
                            <Button 
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                                asChild
                            >
                                <Link href={route('parts', { preselect_drive: drive.id })}>
                                    <PlusIcon className="h-4 w-4 mr-2" /> 
                                    Attach a Part
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 