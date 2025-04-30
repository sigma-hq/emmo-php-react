import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, HardDrive, Wrench, ClipboardCheck, Hammer, Users as UsersIcon, List } from 'lucide-react';
import AppLogo from './app-logo';

// Define navigation items with potential grouping info
const navItems: (NavItem & { group: string })[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid, group: 'Overview' },
    { title: 'Drive', href: '/drive', icon: HardDrive, group: 'Operations' },
    { title: 'Inspections', href: '/inspections', icon: ClipboardCheck, group: 'Operations' },
    { title: 'Maintenances', href: '/maintenances', icon: Hammer, group: 'Operations' },
    { title: 'View Items', href: '/view-items', icon: List, group: 'Operations' },
    { title: 'Parts', href: '/parts', icon: Wrench, group: 'Resources' },
    { title: 'Users', href: '/users', icon: UsersIcon, group: 'Admin' },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

// Helper function to group items
const groupNavItems = (items: (NavItem & { group: string })[]) => {
    return items.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);
};

export function AppSidebar() {
    const page = usePage();
    const groupedNavItems = groupNavItems(navItems);

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
                                    <SidebarMenuButton
                                        asChild isActive={item.href === page.url}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
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
