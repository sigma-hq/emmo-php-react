import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription,
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { 
    PlusIcon, 
    Pencil, 
    Trash2, 
    CheckCircle, 
    Users as UsersIcon, 
    Search, 
    X, 
    ArrowRight, 
    ChevronLeft, 
    ChevronRight, 
    Eye, 
    BarChart3,
    Activity,
    ClipboardCheck,
    Wrench,
    Clock,
    AlertTriangle,
    CheckSquare,
    XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'operator';
    created_at: string;
    updated_at: string;
}

interface UserPerformance {
    user_id: number;
    user_name: string;
    total_inspections: number;
    completed_inspections: number;
    completion_rate: number;
    total_results: number;
    passed_results: number;
    failed_results: number;
    pass_rate: number;
    total_maintenances: number;
    completed_maintenances: number;
    pending_maintenances: number;
    recent_activity: Array<{
        type: 'inspection' | 'maintenance' | 'result';
        id: number;
        title: string;
        created_at: string;
        status?: string;
    }>;
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

interface UserPerformanceData {
    user_id: number;
    user_name: string;
    user_email: string;
    role: string;
    total_inspections: number;
    completed_inspections: number;
    failed_inspections: number;
    completion_rate: number;
    failure_rate: number;
    total_maintenances: number;
    completed_maintenances: number;
    pending_maintenances: number;
    maintenance_completion_rate: number;
    created_at: string;
}

interface UsersPageProps {
    users: {
        data: User[];
    } & Pagination;
    selectedUser?: User | null;
    userPerformance?: UserPerformance | null;
    userPerformanceData?: UserPerformanceData[];
    overallStats?: {
        total_users: number;
        total_inspections: number;
        total_maintenances: number;
        average_completion_rate: number;
    };
    recentActivity?: Array<{
        user_name: string;
        action: string;
        target: string;
        created_at: string;
    }>;
    dateRange?: number;
    flash?: {
        success?: string;
    };
    isAdmin?: boolean;
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

export default function Users({ 
    users, 
    selectedUser, 
    userPerformance, 
    userPerformanceData,
    overallStats, 
    recentActivity, 
    dateRange = 30,
    flash, 
    isAdmin 
}: UsersPageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('management');
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        id: '',
        name: '',
        email: '',
        role: 'operator',
        password: '',
        password_confirmation: '',
    });
    
    // Handle flash messages from the backend
    useEffect(() => {
        if (flash && flash.success) {
            setSuccessMessage(flash.success);
            setShowSuccessNotification(true);
            
            // Auto-hide the notification after 3 seconds
            const timer = setTimeout(() => {
                setShowSuccessNotification(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [flash]);
    
    const openCreateDialog = () => {
        reset();
        setIsEditMode(false);
        setIsOpen(true);
    };
    
    const openEditDialog = (user: User) => {
        reset();
        setData({
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            password: '',
            password_confirmation: '',
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

    const goToPage = (url: string | null) => {
        if (url) {
            // Parse the URL to extract the page parameter
            const urlObj = new URL(url, window.location.origin);
            const page = urlObj.searchParams.get('page');
            
            // Navigate with current search term preserved
            router.get(route('users'), {
                search: searchTerm,
                page: page
            }, {
                preserveState: true,
                preserveScroll: true,
                only: ['users']
            });
        }
    };

    const getRoleBadgeClasses = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
            case 'operator':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <AlertTriangle className="h-4 w-4" />;
            case 'operator':
                return <UsersIcon className="h-4 w-4" />;
            default:
                return <UsersIcon className="h-4 w-4" />;
        }
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
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
                
                {/* Page Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <UsersIcon className="h-6 w-6 text-[var(--emmo-green-primary)]" />
                            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                        </div>
                        {isAdmin && (
                            <Button onClick={openCreateDialog} className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                New User
                        </Button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Manage users and view performance metrics across the system.
                    </p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <TabsList className="grid grid-cols-2 w-full max-w-md">
                        <TabsTrigger value="management" className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" />
                            <span>User Management</span>
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>Performance</span>
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6 flex-1">
                        <TabsContent value="management" className="h-full">
                            {/* User Management Tab */}
                            <div className="space-y-6">
                    {/* Search Bar */}
                                <div className="relative">
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
                
                {/* Users Table */}
                <div className="overflow-x-auto -mx-6">
                    {users.data.length > 0 ? (
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Name</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Email</th>
                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Role</th>
                                                    <th className="sticky top-0 bg-white dark:bg-gray-900 z-10 text-left px-6 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 text-sm">Created</th>
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
                                                            <Badge className={getRoleBadgeClasses(user.role)}>
                                                                <span className="flex items-center gap-1">
                                                                    {getRoleIcon(user.role)}
                                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </span>
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="invisible group-hover:visible flex justify-end gap-3 items-center">
                                                                <Link
                                                                    href={route('api.users.show', user.id)}
                                                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                                {isAdmin && (
                                                                    <>
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
                                                                    </>
                                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                                            <UsersIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {searchTerm ? 'No matching users found' : 'No users yet'}
                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mx-auto mb-6">
                                {searchTerm 
                                    ? `We couldn't find any users matching "${searchTerm}". Try a different search or clear the filter.` 
                                                    : 'Get started by creating your first user to manage system access.'}
                            </p>
                            
                                            {!searchTerm && isAdmin && (
                                <Button 
                                    onClick={openCreateDialog} 
                                    className="inline-flex items-center bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-dark)] text-white font-medium rounded-full px-4 py-2"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1.5" />
                                                    Add Your First User
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
                
                                {/* Pagination */}
                                {users.data.length > 0 && (
                                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Showing <span className="font-medium">{users.from}</span> to <span className="font-medium">{users.to}</span> of{' '}
                                            <span className="font-medium">{users.total}</span> users
                                            {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`${!users.prev_page_url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                onClick={() => goToPage(users.prev_page_url)}
                                                disabled={!users.prev_page_url}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                <span className="sr-only">Previous</span>
                                            </Button>
                                            
                                            <div className="flex items-center gap-1">
                                                {users.links.filter(link => !link.label.includes('Previous') && !link.label.includes('Next')).map((link, i) => {
                                                    // Skip ellipsis links if too many pages
                                                    if (users.last_page > 7) {
                                                        if (
                                                            users.current_page > 4 && 
                                                            i > 1 && 
                                                            i < users.links.length - 4 && 
                                                            Math.abs(i - users.current_page) > 1
                                                        ) {
                                                            return null;
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <Button
                                                            key={i}
                                                            variant={link.active ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => goToPage(link.url)}
                                                            className="min-w-[2rem]"
                                                        >
                                                            {link.label}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`${!users.next_page_url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                onClick={() => goToPage(users.next_page_url)}
                                                disabled={!users.next_page_url}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                                <span className="sr-only">Next</span>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="performance" className="h-full">
                            {/* Performance Tab */}
                            <div className="space-y-6">
                                {/* Performance Search */}
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input 
                                            type="text" 
                                            placeholder="Search operators by name..." 
                                            className="pl-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-[var(--emmo-green-primary)] focus:border-[var(--emmo-green-primary)]"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {/* Performance Overview */}
                                {overallStats && (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{overallStats.total_users}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    Active operators
                                                </p>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
                                                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{overallStats.total_inspections}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    Across all users
                                                </p>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Maintenances</CardTitle>
                                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{overallStats.total_maintenances}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    Maintenance records
                                                </p>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{overallStats.average_completion_rate}%</div>
                                                <p className="text-xs text-muted-foreground">
                                                    Inspection completion
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Performance Summary */}
                                {userPerformanceData && userPerformanceData.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Performance Summary</CardTitle>
                                            <CardDescription>
                                                Key insights from all users
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {userPerformanceData.filter(u => u.total_inspections > 0 || u.total_maintenances > 0).length}
                                                </div>
                                                <div className="text-sm text-gray-500">Active Operators</div>
                                            </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {Math.round(userPerformanceData.reduce((sum, u) => sum + u.completion_rate, 0) / userPerformanceData.length)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Avg Completion Rate</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {userPerformanceData.reduce((sum, u) => sum + u.total_inspections, 0)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Inspections Performed</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {userPerformanceData.reduce((sum, u) => sum + u.total_maintenances, 0)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Maintenances Created</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Individual User Performance */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Operator Performance</CardTitle>
                                        <CardDescription>
                                            Performance metrics for inspections performed and maintenances created by each operator
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {userPerformanceData && userPerformanceData.length > 0 ? (
                                                <div className="space-y-4">
                                                    {userPerformanceData
                                                        .filter(user => 
                                                            searchTerm === '' || 
                                                            user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
                                                        )
                                                        .map((user) => (
                                                        <div key={user.user_id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                                        user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
                                                                    }`}>
                                                                        <UsersIcon className={`h-5 w-5 ${
                                                                            user.role === 'admin' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                                                                        }`} />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-medium text-gray-900 dark:text-white">{user.user_name}</h3>
                                                                        <p className="text-sm text-gray-500">{user.user_email}</p>
                                                                        <Badge className={`mt-1 ${
                                                                            user.role === 'admin' 
                                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                                                        }`}>
                                                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {user.completion_rate}% Completion Rate
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {user.total_inspections} total inspections
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Performance Metrics Grid */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                {/* Inspections */}
                                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ClipboardCheck className="h-4 w-4 text-blue-600" />
                                                                        <span className="text-sm font-medium">Inspections</span>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                                                            <span className="font-medium">{user.total_inspections}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                                                                            <span className="font-medium text-green-600">{user.completed_inspections}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                                                                            <span className="font-medium text-red-600">{user.failed_inspections}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                                                                            <span className={`font-medium ${
                                                                                user.completion_rate >= 80 ? 'text-green-600' :
                                                                                user.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                                            }`}>
                                                                                {user.completion_rate}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                                                                                 {/* Maintenances */}
                                                                 <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                                     <div className="flex items-center gap-2 mb-2">
                                                                         <Wrench className="h-4 w-4 text-orange-600" />
                                                                         <span className="text-sm font-medium">Maintenances Created</span>
                                                                     </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                                                            <span className="font-medium">{user.total_maintenances}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                                                                            <span className="font-medium text-green-600">{user.completed_maintenances}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                                                                            <span className="font-medium text-yellow-600">{user.pending_maintenances}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                                                                            <span className={`font-medium ${
                                                                                user.maintenance_completion_rate >= 80 ? 'text-green-600' :
                                                                                user.maintenance_completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                                            }`}>
                                                                                {user.maintenance_completion_rate}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Performance Indicators */}
                                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Activity className="h-4 w-4 text-purple-600" />
                                                                        <span className="text-sm font-medium">Performance</span>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                                                                            <span className={`font-medium ${
                                                                                user.completion_rate >= 80 ? 'text-green-600' :
                                                                                user.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                                            }`}>
                                                                                {user.completion_rate}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Failure Rate:</span>
                                                                            <span className={`font-medium ${
                                                                                user.failure_rate <= 10 ? 'text-green-600' :
                                                                                user.failure_rate <= 20 ? 'text-yellow-600' : 'text-red-600'
                                                                            }`}>
                                                                                {user.failure_rate}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                                {new Date(user.created_at).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Quick Actions */}
                                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                                                                        <span className="text-sm font-medium">Actions</span>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Link
                                                                            href={route('api.users.show', user.user_id)}
                                                                            className="block w-full text-center text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-1 px-2 rounded transition-colors"
                                                                        >
                                                                            View Details
                                                                        </Link>
                                                                        {user.total_inspections > 0 && (
                                                                            <div className="text-xs text-center text-gray-500">
                                                                                {user.completed_inspections} of {user.total_inspections} inspections completed
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                                    <p className="text-gray-500">No operator performance data available</p>
                                                    <p className="text-sm text-gray-400 mt-2">Performance data will appear once operators start creating inspections and maintenances.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Activity */}
                                {recentActivity && recentActivity.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Recent Activity</CardTitle>
                                            <CardDescription>
                                                Latest user activities across the system
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {recentActivity.map((activity, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <Activity className="h-4 w-4 text-gray-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{activity.user_name}</p>
                                                            <p className="text-xs text-gray-500">{activity.action} {activity.target}</p>
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(activity.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Create/Edit User Dialog */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            {/* Header with visual treatment */}
                            <div className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-2">
                                    {isEditMode ? 'Edit User' : 'Add New User'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 max-w-sm">
                                    {isEditMode 
                                        ? 'Update user information and permissions.' 
                                        : 'Enter details for a new system user.'}
                                </DialogDescription>
                            </div>
                            
                            {/* Form Fields */}
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
                                            placeholder="Enter full name"
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
                                            placeholder="Enter email address"
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
                                        <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select user role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="operator">Operator</SelectItem>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.role && (
                                            <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                                        )}
                                    </div>
                                    
                                    {!isEditMode && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-sm font-medium block">
                                                    Password <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full"
                                                    placeholder="Enter password"
                                                    required
                                        />
                                        {errors.password && (
                                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-sm font-medium block">
                                                    Confirm Password <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="w-full"
                                            placeholder="Confirm password"
                                                    required
                                                />
                                                {errors.password_confirmation && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>
                                                )}
                                        </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Footer with gradient border top */}
                            <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => setIsOpen(false)}
                                        className="border-gray-200 dark:border-gray-800"
                                    >
                                        Cancel
                                    </Button>
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
                                            {isEditMode ? 'Save Changes' : 'Create User'}
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
                            {/* Visual header */}
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
                                        <dd className="font-medium text-gray-900 dark:text-white">{userToDelete?.role}</dd>
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