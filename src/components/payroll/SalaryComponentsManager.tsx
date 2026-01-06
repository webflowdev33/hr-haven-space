import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Loader2, Plus, Trash2, Edit2, ArrowUp, ArrowDown, Copy, GripVertical, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: 'earning' | 'deduction';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  percentage_of: string | null;
  percentage_value: number | null;
  is_taxable: boolean;
  is_pf_applicable: boolean;
  is_esi_applicable: boolean;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
}

const SalaryComponentsManager: React.FC = () => {
  const { company } = useCompany();
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Partial<SalaryComponent> | null>(null);
  const [confirmUnlock, setConfirmUnlock] = useState(false);

  const defaultComponent: Partial<SalaryComponent> = {
    name: '',
    code: '',
    type: 'earning',
    calculation_type: 'fixed',
    percentage_of: null,
    percentage_value: null,
    is_taxable: true,
    is_pf_applicable: false,
    is_esi_applicable: false,
    is_system: false,
    is_active: true,
    sort_order: 0,
  };

  useEffect(() => {
    if (company?.id) {
      fetchComponents();
    }
  }, [company?.id]);

  const fetchComponents = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_components')
        .select('*')
        .eq('company_id', company!.id)
        .order('type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setComponents((data || []) as SalaryComponent[]);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultComponents = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      const defaultComponents = [
        { name: 'Basic Salary', code: 'BASIC', type: 'earning', calculation_type: 'fixed', is_taxable: true, is_pf_applicable: true, is_esi_applicable: true, is_system: false, sort_order: 1 },
        { name: 'House Rent Allowance', code: 'HRA', type: 'earning', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 40, is_taxable: true, is_pf_applicable: false, is_esi_applicable: true, is_system: false, sort_order: 2 },
        { name: 'Conveyance Allowance', code: 'CONV', type: 'earning', calculation_type: 'fixed', is_taxable: true, is_pf_applicable: false, is_esi_applicable: true, is_system: false, sort_order: 3 },
        { name: 'Special Allowance', code: 'SPECIAL', type: 'earning', calculation_type: 'fixed', is_taxable: true, is_pf_applicable: false, is_esi_applicable: true, is_system: false, sort_order: 4 },
        { name: 'Medical Allowance', code: 'MEDICAL', type: 'earning', calculation_type: 'fixed', is_taxable: false, is_pf_applicable: false, is_esi_applicable: true, is_system: false, sort_order: 5 },
        { name: 'Dearness Allowance', code: 'DA', type: 'earning', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 10, is_taxable: true, is_pf_applicable: true, is_esi_applicable: true, is_system: false, sort_order: 6 },
        { name: 'Leave Travel Allowance', code: 'LTA', type: 'earning', calculation_type: 'fixed', is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 7 },
        { name: 'Performance Bonus', code: 'BONUS', type: 'earning', calculation_type: 'fixed', is_taxable: true, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 8 },
        { name: 'Overtime', code: 'OT', type: 'earning', calculation_type: 'fixed', is_taxable: true, is_pf_applicable: false, is_esi_applicable: true, is_system: false, sort_order: 9 },
        { name: 'Provident Fund', code: 'PF', type: 'deduction', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 12, is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 100 },
        { name: 'ESI', code: 'ESI', type: 'deduction', calculation_type: 'percentage', percentage_of: 'GROSS', percentage_value: 0.75, is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 101 },
        { name: 'Professional Tax', code: 'PT', type: 'deduction', calculation_type: 'fixed', is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 102 },
        { name: 'TDS', code: 'TDS', type: 'deduction', calculation_type: 'fixed', is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 103 },
        { name: 'Loan Recovery', code: 'LOAN', type: 'deduction', calculation_type: 'fixed', is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 104 },
        { name: 'Advance Recovery', code: 'ADV', type: 'deduction', calculation_type: 'fixed', is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 105 },
        { name: 'Other Deductions', code: 'OTHER_DED', type: 'deduction', calculation_type: 'fixed', is_taxable: false, is_pf_applicable: false, is_esi_applicable: false, is_system: false, sort_order: 106 },
      ];

      const { error } = await supabase
        .from('salary_components')
        .insert(defaultComponents.map(c => ({ ...c, company_id: company.id, is_active: true })));

      if (error) throw error;
      toast.success('Default salary components created');
      fetchComponents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create default components');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id || !editingComponent) return;
    if (!editingComponent.name || !editingComponent.code) {
      toast.error('Name and code are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_id: company.id,
        name: editingComponent.name,
        code: editingComponent.code.toUpperCase(),
        type: editingComponent.type,
        calculation_type: editingComponent.calculation_type,
        percentage_of: editingComponent.calculation_type === 'percentage' ? editingComponent.percentage_of : null,
        percentage_value: editingComponent.calculation_type === 'percentage' ? editingComponent.percentage_value : null,
        is_taxable: editingComponent.is_taxable ?? true,
        is_pf_applicable: editingComponent.is_pf_applicable ?? false,
        is_esi_applicable: editingComponent.is_esi_applicable ?? false,
        is_system: editingComponent.is_system ?? false,
        is_active: editingComponent.is_active ?? true,
        sort_order: editingComponent.sort_order ?? components.length + 1,
      };

      if (editingComponent.id) {
        const { error } = await supabase
          .from('salary_components')
          .update(payload)
          .eq('id', editingComponent.id);
        if (error) throw error;
        toast.success('Component updated successfully');
      } else {
        const { error } = await supabase
          .from('salary_components')
          .insert(payload);
        if (error) throw error;
        toast.success('Component created successfully');
      }

      setDialogOpen(false);
      setEditingComponent(null);
      fetchComponents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component? This may affect existing salary structures.')) return;
    try {
      const { error } = await supabase
        .from('salary_components')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Component deleted');
      fetchComponents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete component');
    }
  };

  const duplicateComponent = (component: SalaryComponent) => {
    setEditingComponent({
      ...component,
      id: undefined,
      name: `${component.name} (Copy)`,
      code: `${component.code}_COPY`,
      is_system: false,
      sort_order: components.length + 1,
    });
    setDialogOpen(true);
  };

  const updateSortOrder = async (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex(c => c.id === id);
    if (index === -1) return;

    const targetType = components[index].type;
    const typeComponents = components.filter(c => c.type === targetType);
    const typeIndex = typeComponents.findIndex(c => c.id === id);

    if (direction === 'up' && typeIndex === 0) return;
    if (direction === 'down' && typeIndex === typeComponents.length - 1) return;

    const swapIndex = direction === 'up' ? typeIndex - 1 : typeIndex + 1;
    const currentOrder = typeComponents[typeIndex].sort_order;
    const swapOrder = typeComponents[swapIndex].sort_order;

    try {
      await Promise.all([
        supabase.from('salary_components').update({ sort_order: swapOrder }).eq('id', typeComponents[typeIndex].id),
        supabase.from('salary_components').update({ sort_order: currentOrder }).eq('id', typeComponents[swapIndex].id),
      ]);
      fetchComponents();
    } catch (error: any) {
      toast.error('Failed to reorder');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('salary_components')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
      fetchComponents();
      toast.success(isActive ? 'Component activated' : 'Component deactivated');
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const earningComponents = components.filter(c => c.type === 'earning');
  const deductionComponents = components.filter(c => c.type === 'deduction');

  const renderComponentTable = (comps: SalaryComponent[], type: 'earning' | 'deduction') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Calculation</TableHead>
          <TableHead className="text-center">Tax</TableHead>
          <TableHead className="text-center">PF</TableHead>
          <TableHead className="text-center">ESI</TableHead>
          <TableHead className="text-center">Active</TableHead>
          <TableHead className="w-[150px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comps.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
              No {type === 'earning' ? 'earning' : 'deduction'} components yet
            </TableCell>
          </TableRow>
        ) : (
          comps.map((c, index) => (
            <TableRow key={c.id} className={!c.is_active ? 'opacity-50' : ''}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => updateSortOrder(c.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => updateSortOrder(c.id, 'down')}
                    disabled={index === comps.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{c.name}</span>
              </TableCell>
              <TableCell>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{c.code}</code>
              </TableCell>
              <TableCell>
                {c.calculation_type === 'percentage' 
                  ? <span className="text-sm">{c.percentage_value}% of <code className="bg-muted px-1 rounded">{c.percentage_of}</code></span>
                  : <span className="text-sm text-muted-foreground">Fixed Amount</span>}
              </TableCell>
              <TableCell className="text-center">
                {c.is_taxable ? '✓' : '–'}
              </TableCell>
              <TableCell className="text-center">
                {c.is_pf_applicable ? '✓' : '–'}
              </TableCell>
              <TableCell className="text-center">
                {c.is_esi_applicable ? '✓' : '–'}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={c.is_active}
                  onCheckedChange={(v) => toggleActive(c.id, v)}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingComponent(c);
                      setDialogOpen(true);
                    }}
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateComponent(c)}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(c.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Salary Components</CardTitle>
          <CardDescription>
            No salary components configured. Set up default components to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-muted-foreground text-center">
            Initialize with standard Indian payroll components (Basic, HRA, DA, PF, ESI, etc.)
          </p>
          <div className="flex gap-2">
            <Button onClick={initializeDefaultComponents} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Initialize Default Components
            </Button>
            <Button variant="outline" onClick={() => {
              setEditingComponent({ ...defaultComponent });
              setDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Salary Components</h3>
          <p className="text-sm text-muted-foreground">
            Configure earnings and deductions with full control
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setEditingComponent({ ...defaultComponent, type: 'deduction', sort_order: deductionComponents.length + 100 });
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deduction
          </Button>
          <Button onClick={() => {
            setEditingComponent({ ...defaultComponent, sort_order: earningComponents.length + 1 });
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Earning
          </Button>
        </div>
      </div>

      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earnings" className="gap-2">
            Earnings <Badge variant="secondary">{earningComponents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deductions" className="gap-2">
            Deductions <Badge variant="secondary">{deductionComponents.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-green-600 text-base">Earning Components</CardTitle>
              <CardDescription>Components that add to gross salary</CardDescription>
            </CardHeader>
            <CardContent>
              {renderComponentTable(earningComponents, 'earning')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-red-600 text-base">Deduction Components</CardTitle>
              <CardDescription>Components that subtract from gross salary</CardDescription>
            </CardHeader>
            <CardContent>
              {renderComponentTable(deductionComponents, 'deduction')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingComponent?.id ? 'Edit' : 'Add'} Salary Component</DialogTitle>
            <DialogDescription>
              Configure all aspects of this salary component
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={editingComponent?.name || ''}
                    onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                    placeholder="e.g., Basic Salary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={editingComponent?.code || ''}
                    onChange={(e) => setEditingComponent({ ...editingComponent, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., BASIC"
                    className="uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editingComponent?.type || 'earning'}
                    onValueChange={(v) => setEditingComponent({ ...editingComponent, type: v as 'earning' | 'deduction' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earning">Earning (+)</SelectItem>
                      <SelectItem value="deduction">Deduction (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={editingComponent?.sort_order || 0}
                    onChange={(e) => setEditingComponent({ ...editingComponent, sort_order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Calculation */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Calculation Method</h4>
              <div className="space-y-2">
                <Label>Calculation Type</Label>
                <Select
                  value={editingComponent?.calculation_type || 'fixed'}
                  onValueChange={(v) => setEditingComponent({ ...editingComponent, calculation_type: v as 'fixed' | 'percentage' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage of Another Component</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingComponent?.calculation_type === 'percentage' && (
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label>Percentage of</Label>
                    <Select
                      value={editingComponent?.percentage_of || 'BASIC'}
                      onValueChange={(v) => setEditingComponent({ ...editingComponent, percentage_of: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">Basic Salary</SelectItem>
                        <SelectItem value="GROSS">Gross Salary</SelectItem>
                        {earningComponents
                          .filter(c => c.code !== editingComponent?.code)
                          .map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage Value (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingComponent?.percentage_value || ''}
                      onChange={(e) => setEditingComponent({ ...editingComponent, percentage_value: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 12.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Applicability */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Tax & Statutory Applicability</h4>
              <div className="grid gap-4 grid-cols-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Taxable</Label>
                    <p className="text-xs text-muted-foreground">Subject to income tax</p>
                  </div>
                  <Switch
                    checked={editingComponent?.is_taxable ?? true}
                    onCheckedChange={(v) => setEditingComponent({ ...editingComponent, is_taxable: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">Show in salary</p>
                  </div>
                  <Switch
                    checked={editingComponent?.is_active ?? true}
                    onCheckedChange={(v) => setEditingComponent({ ...editingComponent, is_active: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>PF Applicable</Label>
                    <p className="text-xs text-muted-foreground">Included in PF calculation</p>
                  </div>
                  <Switch
                    checked={editingComponent?.is_pf_applicable ?? false}
                    onCheckedChange={(v) => setEditingComponent({ ...editingComponent, is_pf_applicable: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>ESI Applicable</Label>
                    <p className="text-xs text-muted-foreground">Included in ESI calculation</p>
                  </div>
                  <Switch
                    checked={editingComponent?.is_esi_applicable ?? false}
                    onCheckedChange={(v) => setEditingComponent({ ...editingComponent, is_esi_applicable: v })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryComponentsManager;
