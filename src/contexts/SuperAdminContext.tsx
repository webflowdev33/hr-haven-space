import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface SuperAdmin {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  superAdminData: SuperAdmin | null;
  isLoading: boolean;
  refreshSuperAdminStatus: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

export const SuperAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [superAdminData, setSuperAdminData] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSuperAdminStatus = async () => {
    if (!user) {
      setIsSuperAdmin(false);
      setSuperAdminData(null);
      setIsLoading(false);
      return;
    }

    try {
      // Check if user is in super_admins table
      const { data, error } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        // If error is about RLS (user can't access super_admins), they're not a super admin
        console.log('Super admin check:', error.message);
        setIsSuperAdmin(false);
        setSuperAdminData(null);
      } else if (data) {
        setIsSuperAdmin(true);
        setSuperAdminData(data);
      } else {
        setIsSuperAdmin(false);
        setSuperAdminData(null);
      }
    } catch (err) {
      console.error('Error checking super admin status:', err);
      setIsSuperAdmin(false);
      setSuperAdminData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSuperAdminStatus = async () => {
    setIsLoading(true);
    await checkSuperAdminStatus();
  };

  useEffect(() => {
    checkSuperAdminStatus();
  }, [user]);

  return (
    <SuperAdminContext.Provider
      value={{
        isSuperAdmin,
        superAdminData,
        isLoading,
        refreshSuperAdminStatus,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};
