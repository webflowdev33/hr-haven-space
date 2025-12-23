import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface EmployeeDetails {
  id?: string;
  profile_id: string;
  designation?: string | null;
  date_of_joining?: string | null;
  employment_type?: string | null;
  work_location?: string | null;
  employee_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
}

interface EmployeeProfileEditorProps {
  employee: Profile;
  employeeDetails: EmployeeDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EmployeeProfileEditor: React.FC<EmployeeProfileEditorProps> = ({
  employee,
  employeeDetails,
  open,
  onOpenChange,
  onSaved,
}) => {
  const { departments } = useCompany();
  const [saving, setSaving] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    full_name: employee.full_name || '',
    phone: employee.phone || '',
    department_id: employee.department_id || '',
    employee_category: employee.employee_category || 'confirmed',
  });

  const [detailsForm, setDetailsForm] = useState<EmployeeDetails>({
    profile_id: employee.id,
    designation: employeeDetails?.designation || '',
    date_of_joining: employeeDetails?.date_of_joining || '',
    employment_type: employeeDetails?.employment_type || 'full-time',
    work_location: employeeDetails?.work_location || '',
    employee_id: employeeDetails?.employee_id || '',
    date_of_birth: employeeDetails?.date_of_birth || '',
    gender: employeeDetails?.gender || '',
    address: employeeDetails?.address || '',
    city: employeeDetails?.city || '',
    state: employeeDetails?.state || '',
    postal_code: employeeDetails?.postal_code || '',
    country: employeeDetails?.country || '',
    emergency_contact_name: employeeDetails?.emergency_contact_name || '',
    emergency_contact_phone: employeeDetails?.emergency_contact_phone || '',
    emergency_contact_relation: employeeDetails?.emergency_contact_relation || '',
  });

  useEffect(() => {
    setProfileForm({
      full_name: employee.full_name || '',
      phone: employee.phone || '',
      department_id: employee.department_id || '',
      employee_category: employee.employee_category || 'confirmed',
    });
    setDetailsForm({
      profile_id: employee.id,
      designation: employeeDetails?.designation || '',
      date_of_joining: employeeDetails?.date_of_joining || '',
      employment_type: employeeDetails?.employment_type || 'full-time',
      work_location: employeeDetails?.work_location || '',
      employee_id: employeeDetails?.employee_id || '',
      date_of_birth: employeeDetails?.date_of_birth || '',
      gender: employeeDetails?.gender || '',
      address: employeeDetails?.address || '',
      city: employeeDetails?.city || '',
      state: employeeDetails?.state || '',
      postal_code: employeeDetails?.postal_code || '',
      country: employeeDetails?.country || '',
      emergency_contact_name: employeeDetails?.emergency_contact_name || '',
      emergency_contact_phone: employeeDetails?.emergency_contact_phone || '',
      emergency_contact_relation: employeeDetails?.emergency_contact_relation || '',
    });
  }, [employee, employeeDetails]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone || null,
          department_id: profileForm.department_id || null,
          employee_category: profileForm.employee_category as any,
        })
        .eq('id', employee.id);

      if (profileError) throw profileError;

      // Upsert employee details
      const { error: detailsError } = await supabase
        .from('employee_details')
        .upsert({
          profile_id: employee.id,
          designation: detailsForm.designation || null,
          date_of_joining: detailsForm.date_of_joining || null,
          employment_type: detailsForm.employment_type || null,
          work_location: detailsForm.work_location || null,
          employee_id: detailsForm.employee_id || null,
          date_of_birth: detailsForm.date_of_birth || null,
          gender: detailsForm.gender || null,
          address: detailsForm.address || null,
          city: detailsForm.city || null,
          state: detailsForm.state || null,
          postal_code: detailsForm.postal_code || null,
          country: detailsForm.country || null,
          emergency_contact_name: detailsForm.emergency_contact_name || null,
          emergency_contact_phone: detailsForm.emergency_contact_phone || null,
          emergency_contact_relation: detailsForm.emergency_contact_relation || null,
        }, { onConflict: 'profile_id' });

      if (detailsError) throw detailsError;

      toast.success('Employee profile updated successfully');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update employee profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Profile</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={employee.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={profileForm.department_id}
                  onValueChange={(v) => setProfileForm({ ...profileForm, department_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employee Category</Label>
                <Select
                  value={profileForm.employee_category}
                  onValueChange={(v: "trainee" | "intern" | "probation" | "confirmed") => setProfileForm({ ...profileForm, employee_category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trainee">Trainee</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  value={detailsForm.employee_id || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, employee_id: e.target.value })}
                  placeholder="e.g., EMP001"
                />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  value={detailsForm.designation || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, designation: e.target.value })}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select
                  value={detailsForm.employment_type || 'full-time'}
                  onValueChange={(v) => setDetailsForm({ ...detailsForm, employment_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Joining</Label>
                <Input
                  type="date"
                  value={detailsForm.date_of_joining || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, date_of_joining: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Work Location</Label>
                <Input
                  value={detailsForm.work_location || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, work_location: e.target.value })}
                  placeholder="e.g., Remote, Office - NYC"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={detailsForm.date_of_birth || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={detailsForm.gender || ''}
                  onValueChange={(v) => setDetailsForm({ ...detailsForm, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Input
                  value={detailsForm.address || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={detailsForm.city || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={detailsForm.state || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={detailsForm.postal_code || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, postal_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={detailsForm.country || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, country: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Contact Name</Label>
                <Input
                  value={detailsForm.emergency_contact_name || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, emergency_contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  value={detailsForm.emergency_contact_relation || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, emergency_contact_relation: e.target.value })}
                  placeholder="e.g., Spouse, Parent"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Emergency Contact Phone</Label>
                <Input
                  value={detailsForm.emergency_contact_phone || ''}
                  onChange={(e) => setDetailsForm({ ...detailsForm, emergency_contact_phone: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeProfileEditor;
