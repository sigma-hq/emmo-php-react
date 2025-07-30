import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export function SessionExpiryHandler() {
    const { flash } = usePage().props;

    useEffect(() => {
        // Check for session expiry error in flash messages
        if (flash?.error && flash.error.includes('session has expired')) {
            // Show notification and redirect to login
            setTimeout(() => {
                router.visit('/login');
            }, 2000);
        }
    }, [flash]);

    // Handle AJAX session expiry
    useEffect(() => {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Check if response indicates session expiry
                if (response.status === 401) {
                    const data = await response.json();
                    if (data.error === 'Session expired') {
                        // Show notification
                        alert('Your session has expired. You will be redirected to the login page.');
                        router.visit('/login');
                        return response;
                    }
                }
                
                return response;
            } catch (error) {
                return originalFetch(...args);
            }
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    return null;
} 