import React from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, PlusIcon } from 'lucide-react';

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
}

export default function MaintenanceTab({ drive }: MaintenanceTabProps) {
    return (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900/50 mb-4">
                <Wrench className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                No maintenance records
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                Keep track of maintenance tasks performed on this drive, including repairs, 
                upgrades, and preventative maintenance.
            </p>
            
            <Button 
                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
            >
                <PlusIcon className="h-4 w-4 mr-2" /> 
                Log Maintenance
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                Maintenance logging feature coming soon
            </p>
        </div>
    );
} 