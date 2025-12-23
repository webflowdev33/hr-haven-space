import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

interface OnboardingTemplate {
  id: string;
  name: string;
  items?: { id: string }[];
}

interface Employee {
  id: string;
  full_name: string | null;
  email: string;
}

interface AssignOnboardingDialogProps {
  templates: OnboardingTemplate[];
  onAssigned: () => void;
}

const AssignOnboardingDialog: React.FC<AssignOnboardingDialogProps> = ({ templates, onAssigned }) => {
  const { company } = useCompany();
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      // Fetch employees who don't have active onboarding
      const { data: allEmployees, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;

      // Fetch employees with active onboarding
      const { data: onboardingData } = await supabase
        .from('employee_onboarding')
        .select('profile_id')
        .eq('status', 'in_progress');

      const onboardingIds = new Set(onboardingData?.map(o => o.profile_id) || []);
      const availableEmployees = allEmployees?.filter(emp => !onboardingIds.has(emp.id)) || [];
      
      setEmployees(availableEmployees);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open, company?.id]);

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedTemplate) return;

    setSaving(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) throw new Error('Template not found');

      // Create employee onboarding record
      const { data: onboarding, error: onboardingError } = await supabase
        .from('employee_onboarding')
        .insert({
          profile_id: selectedEmployee,
          template_id: selectedTemplate,
          status: 'in_progress',
        })
        .select()
        .single();

      if (onboardingError) throw onboardingError;

      // Create onboarding items from template items
      if (template.items && template.items.length > 0) {
        const items = template.items.map(item => ({
          onboarding_id: onboarding.id,
          template_item_id: item.id,
          is_completed: false,
        }));

        const { error: itemsError } = await supabase
          .from('employee_onboarding_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast.success('Onboarding assigned successfully');
      setOpen(false);
      setSelectedEmployee('');
      setSelectedTemplate('');
      onAssigned();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign onboarding');
    } finally {
      setSaving(false);
    }
  };

  const activeTemplates = templates.filter(t => t.items && t.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign to Employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Onboarding</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No employees available for onboarding</p>
              <p className="text-sm">All employees either have active onboarding or there are no employees.</p>
            </div>
          ) : activeTemplates.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No templates available</p>
              <p className="text-sm">Create a template with items first.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name || emp.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.items?.length || 0} items)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAssign}
                disabled={saving || !selectedEmployee || !selectedTemplate}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Assign Onboarding
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignOnboardingDialog;
