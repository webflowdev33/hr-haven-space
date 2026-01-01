-- Fix security definer views by recreating them with security_invoker = true
DROP VIEW IF EXISTS public.leave_monthly_usage;
CREATE VIEW public.leave_monthly_usage 
WITH (security_invoker = true) AS
SELECT 
  lr.profile_id,
  lr.leave_type_id,
  lt.name as leave_type_name,
  lt.monthly_limit,
  lt.is_monthly_quota,
  EXTRACT(YEAR FROM lr.start_date)::integer as year,
  EXTRACT(MONTH FROM lr.start_date)::integer as month,
  p.company_id,
  p.full_name,
  p.email,
  SUM(CASE WHEN lr.status = 'approved' AND lr.is_paid = true THEN lr.total_days ELSE 0 END) as used_days,
  GREATEST(0, lt.monthly_limit - COALESCE(SUM(CASE WHEN lr.status = 'approved' AND lr.is_paid = true THEN lr.total_days ELSE 0 END), 0)) as remaining_days
FROM public.leave_requests lr
JOIN public.leave_types lt ON lr.leave_type_id = lt.id
JOIN public.profiles p ON lr.profile_id = p.id
WHERE lt.is_monthly_quota = true
GROUP BY lr.profile_id, lr.leave_type_id, lt.name, lt.monthly_limit, lt.is_monthly_quota, 
         EXTRACT(YEAR FROM lr.start_date), EXTRACT(MONTH FROM lr.start_date), 
         p.company_id, p.full_name, p.email;

DROP VIEW IF EXISTS public.leave_balance_summary;
CREATE VIEW public.leave_balance_summary 
WITH (security_invoker = true) AS
SELECT 
  lb.id,
  lb.profile_id,
  lb.leave_type_id,
  lb.year,
  lb.total_days,
  lb.used_days,
  lb.carry_forward_days,
  lb.accrued_days,
  GREATEST(0, lb.total_days + lb.carry_forward_days + COALESCE(lb.accrued_days, 0) - lb.used_days) as remaining_days,
  lt.name as leave_type_name,
  lt.description as leave_type_description,
  lt.days_per_year,
  lt.monthly_credit,
  lt.is_paid,
  lt.is_monthly_quota,
  lt.monthly_limit,
  p.full_name,
  p.email,
  p.company_id,
  p.department_id
FROM public.leave_balances lb
JOIN public.leave_types lt ON lb.leave_type_id = lt.id
JOIN public.profiles p ON lb.profile_id = p.id;