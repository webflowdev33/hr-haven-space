import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users } from "lucide-react";

interface TeamBalance {
  id: string;
  profile_id: string;
  full_name: string | null;
  email: string | null;
  department_id: string | null;
  department_name?: string | null;
  leave_type_id: string;
  leave_type_name: string | null;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number | null;
  carry_forward_days: number;
  accrued_days: number | null;
  is_paid: boolean | null;
  is_monthly_quota: boolean | null;
  monthly_limit: number | null;
}

interface MonthlyUsage {
  profile_id: string;
  leave_type_id: string;
  leave_type_name: string;
  monthly_limit: number;
  year: number;
  month: number;
  used_days: number;
  remaining_days: number;
  company_id: string;
  full_name: string;
  email: string;
}

interface LeaveType {
  id: string;
  name: string;
  is_monthly_quota?: boolean;
  monthly_limit?: number | null;
}

const TeamLeaveBalances: React.FC = () => {
  const { company } = useCompany();
  const [balances, setBalances] = useState<TeamBalance[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    const fetchData = async () => {
      if (!company?.id) return;
      setIsLoading(true);

      const [typesResult, balancesResult, monthlyResult] = await Promise.all([
        supabase.from("leave_types").select("id, name, is_monthly_quota, monthly_limit").eq("company_id", company.id).eq("is_active", true),
        supabase.from("leave_balance_summary").select("*").eq("company_id", company.id).eq("year", selectedYear).order("full_name", { ascending: true }),
        supabase.from("leave_monthly_usage").select("*").eq("company_id", company.id).eq("year", selectedYear).eq("month", selectedMonth),
      ]);

      if (!typesResult.error) setLeaveTypes(typesResult.data || []);
      if (!balancesResult.error) setBalances((balancesResult.data || []) as TeamBalance[]);
      if (!monthlyResult.error) setMonthlyUsage((monthlyResult.data || []) as MonthlyUsage[]);
      setIsLoading(false);
    };
    fetchData();
  }, [company?.id, selectedYear, selectedMonth]);

  const filteredBalances = balances.filter((b) => !b.is_monthly_quota).filter((b) => {
    const matchesSearch = !searchQuery || b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || b.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedLeaveType === "all" || b.leave_type_id === selectedLeaveType;
    return matchesSearch && matchesType;
  });

  const filteredMonthlyUsage = monthlyUsage.filter((u) => {
    const matchesSearch = !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedLeaveType === "all" || u.leave_type_id === selectedLeaveType;
    return matchesSearch && matchesType;
  });

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1];
  const months = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Team Leave Balances</CardTitle>
        <CardDescription>View leave balances for all employees</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Leave Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leave Types</SelectItem>
              {leaveTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {filteredBalances.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6">Annual Leave Balances</h3>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell><p className="font-medium">{b.full_name || "Unknown"}</p><p className="text-xs text-muted-foreground">{b.email}</p></TableCell>
                      <TableCell>{b.leave_type_name}</TableCell>
                      <TableCell className="text-right">{Number(b.total_days).toFixed(1)}</TableCell>
                      <TableCell className="text-right">{Number(b.used_days).toFixed(1)}</TableCell>
                      <TableCell className="text-right font-medium">{Number(b.remaining_days || 0).toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {filteredMonthlyUsage.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6">Monthly Quota Usage ({months.find((m) => m.value === selectedMonth)?.label})</h3>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead className="text-right">Limit/Month</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMonthlyUsage.map((u, idx) => (
                    <TableRow key={`${u.profile_id}-${u.leave_type_id}-${idx}`}>
                      <TableCell><p className="font-medium">{u.full_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></TableCell>
                      <TableCell><span>{u.leave_type_name}</span><Badge variant="outline" className="ml-2 text-xs text-orange-600 border-orange-200">Monthly</Badge></TableCell>
                      <TableCell className="text-right">{u.monthly_limit}</TableCell>
                      <TableCell className="text-right">{Number(u.used_days).toFixed(1)}</TableCell>
                      <TableCell className="text-right font-medium">{Math.max(0, u.monthly_limit - Number(u.used_days)).toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {filteredBalances.length === 0 && filteredMonthlyUsage.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No leave balances found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamLeaveBalances;