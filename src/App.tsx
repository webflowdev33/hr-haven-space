import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RequireSuperAdmin } from "@/components/guards";
import { AppLayout } from "@/components/layout";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";

// Eager: small, always needed
import Auth from "./pages/Auth";

// Lazy-loaded route pages (code-split for faster initial load)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const ModuleDisabled = lazy(() => import("./pages/ModuleDisabled"));
const NotFound = lazy(() => import("./pages/NotFound"));

const SuperAdminDashboard = lazy(() => import("./pages/super-admin/SuperAdminDashboard"));
const CompaniesPage = lazy(() => import("./pages/super-admin/CompaniesPage"));
const CompanyDetailPage = lazy(() => import("./pages/super-admin/CompanyDetailPage"));
const SubscriptionsPage = lazy(() => import("./pages/super-admin/SubscriptionsPage"));
const PlansPage = lazy(() => import("./pages/super-admin/PlansPage"));
const SuperAdminsPage = lazy(() => import("./pages/super-admin/SuperAdminsPage"));
const SettingsPage = lazy(() => import("./pages/super-admin/SettingsPage"));

const CompanySettingsPage = lazy(() => import("./pages/admin/CompanySettingsPage"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage"));
const RolesPermissionsPage = lazy(() => import("./pages/admin/RolesPermissionsPage"));
const ModulesPage = lazy(() => import("./pages/admin/ModulesPage"));

const EmployeeDirectoryPage = lazy(() => import("./pages/hr/EmployeeDirectoryPage"));
const LeaveManagementPage = lazy(() => import("./pages/hr/LeaveManagementPage"));
const AttendancePage = lazy(() => import("./pages/hr/AttendancePage"));
const OnboardingPage = lazy(() => import("./pages/hr/OnboardingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SuperAdminProvider>
            <CompanyProvider>
              <PermissionProvider>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/module-disabled" element={<ModuleDisabled />} />

                    {/* Super Admin routes */}
                    <Route element={<RequireSuperAdmin><SuperAdminLayout /></RequireSuperAdmin>}>
                      <Route path="/super-admin" element={<SuperAdminDashboard />} />
                      <Route path="/super-admin/companies" element={<CompaniesPage />} />
                      <Route path="/super-admin/companies/:companyId" element={<CompanyDetailPage />} />
                      <Route path="/super-admin/subscriptions" element={<SubscriptionsPage />} />
                      <Route path="/super-admin/plans" element={<PlansPage />} />
                      <Route path="/super-admin/admins" element={<SuperAdminsPage />} />
                      <Route path="/super-admin/settings" element={<SettingsPage />} />
                    </Route>

                    {/* Protected routes with layout */}
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />

                      {/* HR Module routes */}
                      <Route element={<ProtectedRoute module="HR_CORE" />}>
                        <Route path="/hr/employees" element={<EmployeeDirectoryPage />} />
                        <Route path="/hr/onboarding" element={<OnboardingPage />} />
                      </Route>

                      {/* Attendance Module routes */}
                      <Route element={<ProtectedRoute module="ATTENDANCE" />}>
                        <Route path="/hr/attendance" element={<AttendancePage />} />
                      </Route>

                      {/* Leave Module routes */}
                      <Route element={<ProtectedRoute module="LEAVE" />}>
                        <Route path="/hr/leave" element={<LeaveManagementPage />} />
                      </Route>

                      {/* Finance Module routes */}
                      <Route element={<ProtectedRoute module="FINANCE" />}>
                        <Route path="/finance/*" element={<Dashboard />} />
                      </Route>

                      {/* Revenue Module routes */}
                      <Route element={<ProtectedRoute module="REVENUE" />}>
                        <Route path="/revenue/*" element={<Dashboard />} />
                      </Route>

                      {/* Sales CRM Module routes */}
                      <Route element={<ProtectedRoute module="SALES_CRM" />}>
                        <Route path="/sales/*" element={<Dashboard />} />
                      </Route>

                      {/* Compliance Module routes */}
                      <Route element={<ProtectedRoute module="COMPLIANCE" />}>
                        <Route path="/compliance/*" element={<Dashboard />} />
                      </Route>

                      {/* Admin Module routes */}
                      <Route element={<ProtectedRoute module="ADMIN" />}>
                        <Route path="/admin/company" element={<CompanySettingsPage />} />
                        <Route path="/admin/users" element={<UserManagementPage />} />
                        <Route path="/admin/roles" element={<RolesPermissionsPage />} />
                        <Route path="/admin/modules" element={<ModulesPage />} />
                        <Route path="/admin/settings" element={<CompanySettingsPage />} />
                      </Route>
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </PermissionProvider>
            </CompanyProvider>
          </SuperAdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
