import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';

export const SuperAdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SuperAdminSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <SuperAdminHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/30">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
