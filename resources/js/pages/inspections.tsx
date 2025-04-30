import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inspections',
        href: '/inspections',
    },
];

export default function Inspections() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inspections" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Inspections Page</h1>
                <p>View and manage inspections here.</p>
                {/* Add Inspections-specific content here */}
            </div>
        </AppLayout>
    );
} 