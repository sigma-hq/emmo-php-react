import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'View Items',
        href: '/view-items',
    },
];

export default function ViewItems() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="View Items" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">View Items Page</h1>
                <p>Display monitored machinery or items here.</p>
                {/* Add Item listing content here */}
            </div>
        </AppLayout>
    );
} 