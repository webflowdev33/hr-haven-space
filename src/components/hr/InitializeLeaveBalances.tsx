import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface InitializeLeaveBalancesProps {
  onInitialized: () => void;
}

const InitializeLeaveBalances: React.FC<InitializeLeaveBalancesProps> = ({ onInitialized }) => {
  const { company } = useCompany();
  const [open, setOpen] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const handleInitialize = async () => {
    if (!company?.id) return;

    setInitializing(true);
    try {
      const currentYear = new Date().getFullYear();

      // Fetch all active employees
      const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', company.id)
        .eq('status', 'active');

      if (empError) throw empError;

      // Fetch all active leave types
      const { data: leaveTypes, error: ltError } = await supabase
        .from('leave_types')
        .select('id, days_per_year')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (ltError) throw ltError;

      if (!employees?.length || !leaveTypes?.length) {
        toast.error('No employees or leave types found');
        return;
      }

      // Check existing balances
      const { data: existingBalances } = await supabase
        .from('leave_balances')
        .select('profile_id, leave_type_id')
        .eq('year', currentYear);

      const existingSet = new Set(
        existingBalances?.map(b => `${b.profile_id}-${b.leave_type_id}`) || []
      );

      // Create new balance records for missing combinations
      const newBalances: {
        profile_id: string;
        leave_type_id: string;
        year: number;
        total_days: number;
        used_days: number;
        carry_forward_days: number;
      }[] = [];

      for (const emp of employees) {
        for (const lt of leaveTypes) {
          const key = `${emp.id}-${lt.id}`;
          if (!existingSet.has(key)) {
            newBalances.push({
              profile_id: emp.id,
              leave_type_id: lt.id,
              year: currentYear,
              total_days: lt.days_per_year || 0,
              used_days: 0,
              carry_forward_days: 0,
            });
          }
        }
      }

      if (newBalances.length === 0) {
        toast.info('All leave balances are already initialized');
        setOpen(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('leave_balances')
        .insert(newBalances);

      if (insertError) throw insertError;

      toast.success(`Initialized ${newBalances.length} leave balance records`);
      setOpen(false);
      onInitialized();
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize leave balances');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Initialize Balances
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initialize Leave Balances</DialogTitle>
          <DialogDescription>
            This will create leave balance records for all active employees for the current year.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-200 rounded-lg mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">What this does:</p>
              <ul className="list-disc list-inside text-amber-700 mt-1 space-y-1">
                <li>Creates balance records for all active employees</li>
                <li>Sets initial balance based on leave type configuration</li>
                <li>Skips employees who already have balances for this year</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleInitialize} disabled={initializing}>
              {initializing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Initialize Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InitializeLeaveBalances;
