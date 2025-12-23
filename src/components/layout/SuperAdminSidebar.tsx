import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Settings,
  Shield,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const superAdminNavItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/super-admin',
    icon: LayoutDashboard,
  },
  {
    id: 'companies',
    title: 'Companies',
    href: '/super-admin/companies',
    icon: Building2,
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    href: '/super-admin/subscriptions',
    icon: CreditCard,
  },
  {
    id: 'plans',
    title: 'Plans',
    href: '/super-admin/plans',
    icon: CreditCard,
  },
  {
    id: 'admins',
    title: 'Super Admins',
    href: '/super-admin/admins',
    icon: Users,
  },
  {
    id: 'settings',
    title: 'Settings',
    href: '/super-admin/settings',
    icon: Settings,
  },
];

export const SuperAdminSidebar = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/super-admin') {
      return location.pathname === '/super-admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <Link to="/super-admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Super Admin</span>
            <span className="text-xs text-muted-foreground">Platform Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {superAdminNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                        isActive(item.href) && 'bg-accent text-accent-foreground font-medium'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Back to App</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
};
