import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, HardDrive, Wrench, ClipboardCheck, Hammer, Users as UsersIcon, BarChart3, StickyNote } from 'lucide-react';
import AppLogo from './app-logo';
import { useState, useEffect } from 'react';

// Define navigation items with potential grouping info and role requirements
const navItems: (NavItem & { group: string; adminOnly?: boolean; disabled?: boolean })[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid, group: 'Overview' },
    { title: 'Drive', href: '/drive', icon: HardDrive, group: 'Operations' },
    { title: 'Inspections', href: '/inspections', icon: ClipboardCheck, group: 'Operations' },
    { title: 'Maintenances', href: '/maintenances', icon: Hammer, group: 'Operations' },
    { title: 'Handout Notes', href: '/handout-notes', icon: StickyNote, group: 'Operations' },
    // { title: 'View Items', href: '/view-items', icon: List, group: 'Operations' },
    { title: 'Parts', href: '/parts', icon: Wrench, group: 'Resources' },
    { title: 'Users', href: '/users', icon: UsersIcon, group: 'Admin', adminOnly: true },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

// Helper function to group items
const groupNavItems = (items: (NavItem & { group: string; adminOnly?: boolean })[]) => {
    return items.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {} as Record<string, (NavItem & { adminOnly?: boolean })[]>);
};

export function AppSidebar() {
    const page = usePage();
    const { auth } = page.props;
    const isAdmin = auth.user.role === 'admin';
    const [driveAlerts, setDriveAlerts] = useState(0);
    
    // Fetch drive alerts for admin users
    useEffect(() => {
        if (isAdmin) {
            fetch('/api/drives/alerts')
                .then(response => response.json())
                .then(data => {
                    setDriveAlerts(data.alert_count || 0);
                })
                .catch(error => {
                    console.error('Failed to fetch drive alerts:', error);
                });
        }
    }, [isAdmin]);
    
    // Filter navigation items based on user role
    const filteredNavItems = navItems.filter(item => {
        // If item is admin-only and user is not admin, hide it
        if (item.adminOnly && !isAdmin) {
            return false;
        }
        return true;
    });
    
    const groupedNavItems = groupNavItems(filteredNavItems);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {Object.entries(groupedNavItems).map(([groupName, items]) => (
                    <SidebarGroup key={groupName} className="px-2 py-0">
                        <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    {item.disabled ? (
                                        <SidebarMenuButton
                                            isActive={false}
                                            aria-disabled
                                            disabled
                                            tooltip={{ children: item.title }}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            <div className="relative">
                                                {item.icon && <item.icon />}
                                                {item.title === 'Drive' && isAdmin && driveAlerts > 0 && (
                                                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                                                        <span className="text-xs text-white font-bold">
                                                            {driveAlerts > 9 ? '9+' : driveAlerts}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    ) : (
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.href === page.url}
                                            tooltip={{ children: item.title }}
                                        >
                                            <Link href={item.href} prefetch>
                                                <div className="relative">
                                                    {item.icon && <item.icon />}
                                                    {/* Show red dot for drive alerts */}
                                                    {item.title === 'Drive' && isAdmin && driveAlerts > 0 && (
                                                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                                                            <span className="text-xs text-white font-bold">
                                                                {driveAlerts > 9 ? '9+' : driveAlerts}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
