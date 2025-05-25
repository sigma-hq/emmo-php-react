import { type SharedData } from '@/types';
import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen items-center justify-center">
                <p>Redirecting...</p>
            </div>
        </>
    );
}
