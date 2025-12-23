import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useCompany } from '@/contexts/CompanyContext';
import { useFilteredNavigation } from '@/hooks/useFilteredNavigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const AppSidebar = () => {
  const { company, branding } = useCompany();
  const filteredNavigation = useFilteredNavigation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={company?.name || 'Company'}
              className="h-8 w-8 rounded object-contain"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-semibold text-sm">
              {company?.name?.charAt(0) || 'C'}
            </div>
          )}
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground truncate">
              {company?.name || 'Company'}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {filteredNavigation.map((section) => (
          <SidebarGroup key={section.id}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) =>
                  item.children ? (
                    <CollapsibleNavItem
                      key={item.id}
                      item={item}
                      collapsed={collapsed}
                      currentPath={location.pathname}
                    />
                  ) : (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                        <NavLink
                          to={item.href}
                          end
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <p className="text-xs text-sidebar-foreground/50">
            © {new Date().getFullYear()} {company?.name}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

interface CollapsibleNavItemProps {
  item: {
    id: string;
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: Array<{
      id: string;
      title: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
    }>;
  };
  collapsed: boolean;
  currentPath: string;
}

const CollapsibleNavItem = ({ item, collapsed, currentPath }: CollapsibleNavItemProps) => {
  const isChildActive = item.children?.some((child) => currentPath.startsWith(child.href));

  return (
    <Collapsible defaultOpen={isChildActive}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
            tooltip={collapsed ? item.title : undefined}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </div>
            {!collapsed && (
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!collapsed && item.children && (
          <CollapsibleContent>
            <SidebarMenu className="ml-4 mt-1 border-l border-sidebar-border pl-2">
              {item.children.map((child) => (
                <SidebarMenuItem key={child.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={child.href}
                      end
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <child.icon className="h-4 w-4 shrink-0" />
                      <span>{child.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
};
