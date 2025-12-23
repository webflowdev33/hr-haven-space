import { Navigate, Outlet } from 'react-router-dom';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireSuperAdminProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route guard that only allows super admins to access the route
 */
export const RequireSuperAdmin = ({ 
  children, 
  redirectTo = '/dashboard' 
}: RequireSuperAdminProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: superAdminLoading } = useSuperAdmin();

  // Show loading while checking auth state
  if (authLoading || superAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to dashboard if not a super admin
  if (!isSuperAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  // User is a super admin, render children or outlet
  return children ? <>{children}</> : <Outlet />;
};
