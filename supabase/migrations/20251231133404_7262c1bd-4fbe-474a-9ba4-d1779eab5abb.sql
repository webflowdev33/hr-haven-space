-- Create a function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_leave_permission(_user_id uuid, _permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id
      AND p.code = _permission_code
  )
$$;

-- Update leave_requests RLS policies to check for permission OR HR role OR Company Admin
DROP POLICY IF EXISTS "HR/Admins can manage leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "HR/Admins can view all leave requests" ON public.leave_requests;

-- Recreate with permission check
CREATE POLICY "Users with leave.approve permission can manage leave requests" 
ON public.leave_requests 
FOR ALL 
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = leave_requests.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )) 
  AND (
    is_company_admin(auth.uid()) 
    OR has_role(auth.uid(), 'HR') 
    OR has_permission(auth.uid(), 'leave.approve')
  )
);

CREATE POLICY "Users with leave.approve permission can view all leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = leave_requests.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )) 
  AND (
    is_company_admin(auth.uid()) 
    OR has_role(auth.uid(), 'HR') 
    OR has_permission(auth.uid(), 'leave.approve')
  )
);

-- Also update leave_balances policies
DROP POLICY IF EXISTS "HR/Admins can manage leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "HR/Admins can view all leave balances" ON public.leave_balances;

CREATE POLICY "Users with leave permissions can manage leave balances" 
ON public.leave_balances 
FOR ALL 
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = leave_balances.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )) 
  AND (
    is_company_admin(auth.uid()) 
    OR has_role(auth.uid(), 'HR') 
    OR has_permission(auth.uid(), 'leave.manage_balance')
  )
);

CREATE POLICY "Users with leave permissions can view all leave balances" 
ON public.leave_balances 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = leave_balances.profile_id 
    AND p.company_id = get_user_company_id(auth.uid())
  )) 
  AND (
    is_company_admin(auth.uid()) 
    OR has_role(auth.uid(), 'HR') 
    OR has_permission(auth.uid(), 'leave.approve')
    OR has_permission(auth.uid(), 'leave.view')
  )
);