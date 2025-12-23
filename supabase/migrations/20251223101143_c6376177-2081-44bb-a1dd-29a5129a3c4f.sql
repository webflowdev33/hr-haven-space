-- Employee details extension table
CREATE TABLE public.employee_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_of_birth date,
  gender text,
  marital_status text,
  nationality text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  date_of_joining date,
  employment_type text DEFAULT 'full-time',
  designation text,
  reporting_manager_id uuid REFERENCES public.profiles(id),
  work_location text,
  employee_id text,
  bank_name text,
  bank_account_number text,
  ifsc_code text,
  pan_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Leave types table
CREATE TABLE public.leave_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  days_per_year integer NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT true,
  is_carry_forward boolean NOT NULL DEFAULT false,
  max_carry_forward_days integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Leave balances table
CREATE TABLE public.leave_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year integer NOT NULL,
  total_days numeric(5,2) NOT NULL DEFAULT 0,
  used_days numeric(5,2) NOT NULL DEFAULT 0,
  carry_forward_days numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, leave_type_id, year)
);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric(5,2) NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Attendance table
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  work_hours numeric(5,2),
  status text NOT NULL DEFAULT 'present',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, date)
);

-- Onboarding checklists table
CREATE TABLE public.onboarding_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding checklist items
CREATE TABLE public.onboarding_template_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  assigned_to_role text,
  due_days integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Employee onboarding progress
CREATE TABLE public.employee_onboarding (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id),
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employee onboarding checklist items progress
CREATE TABLE public.employee_onboarding_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id uuid NOT NULL REFERENCES public.employee_onboarding(id) ON DELETE CASCADE,
  template_item_id uuid NOT NULL REFERENCES public.onboarding_template_items(id),
  is_completed boolean NOT NULL DEFAULT false,
  completed_by uuid REFERENCES public.profiles(id),
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_details
CREATE POLICY "Users can view employee details in their company"
ON public.employee_details FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = employee_details.profile_id 
  AND p.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update their own details"
ON public.employee_details FOR UPDATE
USING (profile_id = auth.uid());

CREATE POLICY "HR/Admins can manage employee details"
ON public.employee_details FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = employee_details.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  ) 
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

-- RLS Policies for leave_types
CREATE POLICY "Users can view leave types in their company"
ON public.leave_types FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admins can manage leave types"
ON public.leave_types FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR')));

-- RLS Policies for leave_balances
CREATE POLICY "Users can view their own leave balance"
ON public.leave_balances FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "HR/Admins can view all leave balances"
ON public.leave_balances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = leave_balances.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

CREATE POLICY "HR/Admins can manage leave balances"
ON public.leave_balances FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = leave_balances.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own leave requests"
ON public.leave_requests FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own leave requests"
ON public.leave_requests FOR INSERT
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their pending leave requests"
ON public.leave_requests FOR UPDATE
USING (profile_id = auth.uid() AND status = 'pending');

CREATE POLICY "HR/Admins can view all leave requests"
ON public.leave_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = leave_requests.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

CREATE POLICY "HR/Admins can manage leave requests"
ON public.leave_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = leave_requests.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance"
ON public.attendance FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their own attendance"
ON public.attendance FOR ALL
USING (profile_id = auth.uid());

CREATE POLICY "HR/Admins can view all attendance"
ON public.attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = attendance.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

CREATE POLICY "HR/Admins can manage attendance"
ON public.attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = attendance.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

-- RLS Policies for onboarding templates
CREATE POLICY "Users can view onboarding templates"
ON public.onboarding_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "HR/Admins can manage onboarding templates"
ON public.onboarding_templates FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR')));

-- RLS Policies for onboarding template items
CREATE POLICY "Users can view onboarding template items"
ON public.onboarding_template_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM onboarding_templates t 
    WHERE t.id = onboarding_template_items.template_id 
    AND t.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "HR/Admins can manage onboarding template items"
ON public.onboarding_template_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM onboarding_templates t 
    WHERE t.id = onboarding_template_items.template_id 
    AND t.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

-- RLS Policies for employee onboarding
CREATE POLICY "Users can view their own onboarding"
ON public.employee_onboarding FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "HR/Admins can view all employee onboarding"
ON public.employee_onboarding FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = employee_onboarding.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

CREATE POLICY "HR/Admins can manage employee onboarding"
ON public.employee_onboarding FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = employee_onboarding.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

-- RLS Policies for employee onboarding items
CREATE POLICY "Users can view their own onboarding items"
ON public.employee_onboarding_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employee_onboarding eo 
    WHERE eo.id = employee_onboarding_items.onboarding_id 
    AND eo.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own onboarding items"
ON public.employee_onboarding_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employee_onboarding eo 
    WHERE eo.id = employee_onboarding_items.onboarding_id 
    AND eo.profile_id = auth.uid()
  )
);

CREATE POLICY "HR/Admins can manage onboarding items"
ON public.employee_onboarding_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM employee_onboarding eo 
    JOIN profiles p ON p.id = eo.profile_id
    WHERE eo.id = employee_onboarding_items.onboarding_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR has_role(auth.uid(), 'HR'))
);

-- Add updated_at triggers
CREATE TRIGGER update_employee_details_updated_at
BEFORE UPDATE ON public.employee_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_types_updated_at
BEFORE UPDATE ON public.leave_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
BEFORE UPDATE ON public.leave_balances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_templates_updated_at
BEFORE UPDATE ON public.onboarding_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_onboarding_updated_at
BEFORE UPDATE ON public.employee_onboarding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();