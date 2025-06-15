import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription,
    AlertDialogFooter, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { PlusIcon, Pencil, Trash2, CheckCircle, User, Search, X, ArrowRight, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'operator';
    created_at: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface Pagination {
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLinks[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

interface UsersPageProps {
    users: {
        data: User[];
    } & Pagination;
    isFirstUser?: boolean;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Users',
        href: '/users',
    },
];

export default function Users({ users, isFirstUser = false, flash }: UsersPageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [showErrorNotification, setShowErrorNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        id: '',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'operator',
    });
    
    // Open dialog automatically if this is the first user
    useEffect(() => {
        if (isFirstUser) {
            openCreateDialog();
        }
    }, [isFirstUser]);
    
    // Handle flash messages from the backend
    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setShowSuccessNotification(true);
            
            // Auto-hide the notification after 3 seconds
            const timer = setTimeout(() => {
                setShowSuccessNotification(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
        
        if (flash?.error) {
            setErrorMessage(flash.error);
            setShowErrorNotification(true);
            
            // Auto-hide the notification after 5 seconds
            const timer = setTimeout(() => {
                setShowErrorNotification(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [flash]);
    
    // Handle search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                route('users'),
                { search: searchTerm },
                { preserveState: true, preserveScroll: true, only: ['users'] }
            );
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);
    
    const openCreateDialog = () => {
        reset();
        // If it's the first user, set role to admin
        if (isFirstUser) {
            setData('role', 'admin');
        } else {
            setData('role', 'operator');
        }
        setIsEditMode(false);
        setIsOpen(true);
    };
    
    const openEditDialog = (user: User) => {
        reset();
        setData({
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: user.role,
        });
        setIsEditMode(true);
        setIsOpen(true);
    };
    
    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditMode) {
            put(route('api.users.update', data.id), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        } else {
            post(route('api.users.store'), {
                onSuccess: () => {
                    setIsOpen(false);
                }
            });
        }
    };
    
    const handleDelete = () => {
        if (userToDelete) {
            router.delete(route('api.users.destroy', userToDelete.id));
            setShowDeleteDialog(false);
            setUserToDelete(null);
        }
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Success Notification */}
                {showSuccessNotification && (
                    <div className="fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out">
                        <div className="flex items-center gap-3 bg-[var(--emmo-green-primary)] text-white px-4 py-3 rounded-lg shadow-lg">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">{successMessage}</p>
                            <button 
                                onClick={() => setShowSuccessNotification(false)}
                                className="ml-2 text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Error Notification */}
                {showErrorNotification && (
                    <div className="fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out">
                        <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
                            <Shield className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">{errorMessage}</p>
                            <button 
                                onClick={() => setShowErrorNotification(false)}
                                className="ml-2 text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Page Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <User className="h-6 w-6 text-[var(--emmo-green-primary)]" />
                            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                        </div>
                        
                        <Button 
                            onClick={openCreateDialog} 
                            className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] rounded-full px-4 transition-all duration-200 hover:shadow-md"
                        >
                            <PlusIcon className="mr-2 h-4 w-4" /> New User
                        </Button>
                    </div>
                    
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                        Manage system users and their permissions. Admins have full access, while operators have restricted permissions.
                    </p>
                    
                    {/* Search Bar */}
                    <div className="relative mt-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input 
                            type="text" 
                            placeholder="Search users by name or email..." 
                            className="pl-10 max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                </div>
                
                {/* Users Table */}
                <div className="overflow-x-auto -mx-6">
                    {users.data.length > 0 ? (
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Name</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Email</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Role</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-right px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user, index) => (
                                    <tr 
                                        key={user.id} 
                                        className={`relative group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-sm">
                                            <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {user.role === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                                    Operator
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="invisible group-hover:visible flex justify-end gap-3 items-center">
                                                <button 
                                                    onClick={() => openEditDialog(user)}
                                                    className="text-[var(--emmo-green-primary)] hover:text-[var(--emmo-green-dark)] transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteDialog(user)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-full p-4 mb-4">
                                <User className="h-10 w-10 text-[var(--emmo-green-primary)]" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                {searchTerm ? 'No matching users found' : 'No users yet'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                                {searchTerm 
                                    ? `We couldn't find any users matching "${searchTerm}". Try a different search or clear the filter.` 
                                    : isFirstUser ? 'Let\'s create your first admin user to get started.' : 'Get started by creating your first user for the system.'}
                            </p>
                            
                            {!searchTerm && (
                                <Button 
                                    onClick={openCreateDialog} 
                                    className="inline-flex items-center bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] text-white font-medium rounded-full px-4 py-2"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                    {isFirstUser ? 'Create Admin User' : 'Add Your First User'}
                                </Button>
                            )}
                            
                            {searchTerm && (
                                <Button 
                                    onClick={() => setSearchTerm('')} 
                                    variant="outline" 
                                    className="inline-flex items-center font-medium rounded-full px-4 py-2"
                                >
                                    <X className="h-4 w-4 mr-1.5" />
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Create/Edit Dialog */}
                <Dialog open={isOpen} onOpenChange={(isOpen) => {
                    // If this is the first user creation, don't allow closing the dialog
                    if (!isFirstUser || users.data.length > 0) {
                        setIsOpen(isOpen);
                    }
                }}>
                    <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            <div className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-2">
                                    {isFirstUser && !isEditMode
                                        ? 'Create Admin User'
                                        : isEditMode 
                                            ? 'Edit User' 
                                            : 'Add New User'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 max-w-sm">
                                    {isFirstUser && !isEditMode
                                        ? 'Create the first administrator account to manage the system.'
                                        : isEditMode 
                                            ? 'Update user details and permissions.' 
                                            : 'Create a new user for the system.'}
                                </DialogDescription>
                            </div>
                            
                            <div className="p-6 overflow-y-auto">
                                <div className="space-y-6">
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
                                        <Label htmlFor="password" className="text-sm font-medium block">
                                            Password {!isEditMode && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full"
                                            placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                                            required={!isEditMode}
                                        />
                                        {errors.password && (
                                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-sm font-medium block">
                                            Confirm Password {!isEditMode && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="w-full"
                                            placeholder="Confirm password"
                                            required={!isEditMode}
                                        />
                                    </div>
                                    
                                    {/* Only show role selection if not creating first user */}
                                    {!(isFirstUser && !isEditMode) && (
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-sm font-medium block">
                                                Role <span className="text-red-500">*</span>
                                            </Label>
                                            <Select 
                                                value={data.role} 
                                                onValueChange={(value: 'admin' | 'operator') => setData('role', value)}
                                                disabled={isFirstUser}
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
                                    )}
                                    
                                    {/* Show role explanation for first user */}
                                    {isFirstUser && !isEditMode && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                <Shield className="inline-block h-4 w-4 mr-1 mb-1" />
                                                The first user will automatically be created as an admin with full system access.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                                {/* Only show cancel button if not creating first user */}
                                {(!isFirstUser || users.data.length > 0) && (
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => setIsOpen(false)}
                                        className="border-gray-200 dark:border-gray-800"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                
                                <Button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] transition-colors px-5"
                                >
                                    {processing ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            {isFirstUser && !isEditMode
                                                ? 'Create Admin Account'
                                                : isEditMode 
                                                    ? 'Save Changes' 
                                                    : 'Create User'}
                                            <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
                
                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent className="max-w-[450px] rounded-xl p-0 overflow-hidden">
                        <div className="flex flex-col h-full">
                            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-full p-2">
                                        <Trash2 className="h-5 w-5 text-white" />
                                    </div>
                                    <AlertDialogTitle className="text-xl font-bold">Delete User</AlertDialogTitle>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <AlertDialogDescription className="text-base mb-4">
                                    Are you sure you want to delete this user?
                                </AlertDialogDescription>
                                
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4 mb-4">
                                    <div className="font-medium text-red-800 dark:text-red-300 mb-2">User Information</div>
                                    <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                                        <dt className="text-gray-600 dark:text-gray-400">Name:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{userToDelete?.name}</dd>
                                        
                                        <dt className="text-gray-600 dark:text-gray-400">Email:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">{userToDelete?.email}</dd>
                                        
                                        <dt className="text-gray-600 dark:text-gray-400">Role:</dt>
                                        <dd className="font-medium text-gray-900 dark:text-white capitalize">{userToDelete?.role}</dd>
                                    </dl>
                                </div>
                                
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    This action cannot be undone. The user will be permanently removed from the system.
                                </p>
                            </div>
                            
                            <AlertDialogFooter className="flex-row-reverse justify-start gap-3 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-950">
                                <AlertDialogAction 
                                    onClick={handleDelete} 
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium"
                                >
                                    Permanently Delete
                                </AlertDialogAction>
                                <AlertDialogCancel className="border-gray-200 dark:border-gray-800">
                                    Cancel
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
} 