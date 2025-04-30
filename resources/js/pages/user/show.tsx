import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, User, Mail, Shield, CalendarDays, Save, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'operator';
    created_at: string;
    updated_at: string;
}

interface UserShowProps {
    user: User;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function UserShow({ user, flash }: UserShowProps) {
    const [editMode, setEditMode] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        password_confirmation: '',
    });
    
    useEffect(() => {
        if (flash?.error) {
            setErrorMessage(flash.error);
            setShowError(true);
        }
    }, [flash]);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Users',
            href: '/users',
        },
        {
            title: user.name,
            href: route('api.users.show', user.id),
        },
    ];
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        
        // Validate password confirmation if password is provided
        if (data.password && data.password !== data.password_confirmation) {
            setErrorMessage('Password confirmation does not match');
            setShowError(true);
            return;
        }
        
        put(route('api.users.update', user.id), {
            onSuccess: () => {
                setEditMode(false);
                setShowError(false);
            },
            onError: (errors) => {
                if (errors.role) {
                    setErrorMessage(errors.role);
                    setShowError(true);
                }
            }
        });
    };
    
    const handleCancel = () => {
        reset();
        setEditMode(false);
        setShowError(false);
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - User Details`} />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(route('users'))}
                                className="rounded-full h-8 gap-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Users</span>
                            </Button>
                        </div>
                        
                        {!editMode ? (
                            <Button 
                                onClick={() => setEditMode(true)}
                                className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                            >
                                Edit User
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleCancel}
                                variant="outline"
                            >
                                Cancel Editing
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                        <div className="bg-[var(--emmo-green-light)] p-4 rounded-full">
                            <User className="h-8 w-8 text-[var(--emmo-green-primary)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                {user.role === 'admin' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                                        Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                        Operator
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>
                
                {!editMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                    User Information
                                </CardTitle>
                                <CardDescription>
                                    Basic details about the user
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-4">
                                    <div className="flex items-start">
                                        <dt className="w-1/3 font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                            <User className="mr-2 h-4 w-4 text-[var(--emmo-green-primary)]" />
                                            Name
                                        </dt>
                                        <dd className="w-2/3">{user.name}</dd>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <dt className="w-1/3 font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                            <Mail className="mr-2 h-4 w-4 text-[var(--emmo-green-primary)]" />
                                            Email
                                        </dt>
                                        <dd className="w-2/3">{user.email}</dd>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <dt className="w-1/3 font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                            <Shield className="mr-2 h-4 w-4 text-[var(--emmo-green-primary)]" />
                                            Role
                                        </dt>
                                        <dd className="w-2/3 capitalize">{user.role}</dd>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <dt className="w-1/3 font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                            <CalendarDays className="mr-2 h-4 w-4 text-[var(--emmo-green-primary)]" />
                                            Created
                                        </dt>
                                        <dd className="w-2/3">{format(new Date(user.created_at), 'PPP')}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-[var(--emmo-green-primary)]" />
                                    Permissions &amp; Access
                                </CardTitle>
                                <CardDescription>
                                    User role and system access
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                                        <h3 className="font-medium mb-2">{user.role === 'admin' ? 'Admin Access' : 'Operator Access'}</h3>
                                        <ul className="space-y-2 text-sm">
                                            {user.role === 'admin' ? (
                                                <>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>Full system access</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>User management</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>Drive and parts management</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>Inspection and maintenance access</span>
                                                    </li>
                                                </>
                                            ) : (
                                                <>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>Limited system access</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>View drives and parts</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>Record inspections</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                        <span>Cannot manage users</span>
                                                    </li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                        {showError && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {errorMessage}
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit User</CardTitle>
                                <CardDescription>Update user information and permissions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium block">
                                        Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full"
                                        placeholder="Enter user's full name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium block">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full"
                                        placeholder="user@example.com"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-sm font-medium block">
                                        Role <span className="text-red-500">*</span>
                                    </Label>
                                    <Select 
                                        value={data.role} 
                                        onValueChange={(value: 'admin' | 'operator') => setData('role', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="operator">Operator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role && (
                                        <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Admins have full access. Operators have limited permissions.
                                    </p>
                                </div>
                                
                                <hr className="my-2 border-gray-200 dark:border-gray-800" />
                                
                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 mb-2">
                                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                                        <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>Leave password fields empty to keep the current password.</span>
                                    </p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium block">
                                        New Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full"
                                        placeholder="Enter new password"
                                    />
                                    {errors.password && (
                                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-sm font-medium block">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                
                                <div className="pt-4 flex justify-end">
                                    <Button 
                                        type="submit" 
                                        disabled={processing} 
                                        className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)]"
                                    >
                                        {processing ? (
                                            <div className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                )}
            </div>
        </AppLayout>
    );
} 