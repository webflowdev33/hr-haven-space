-- Super Admin table for platform owners (separate from company roles)
CREATE TABLE public.super_admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email text NOT NULL,
    full_name text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price_monthly numeric(10,2) NOT NULL DEFAULT 0,
    price_yearly numeric(10,2) NOT NULL DEFAULT 0,
    max_users integer,
    max_departments integer,
    allowed_modules text[] NOT NULL DEFAULT '{}',
    features jsonb DEFAULT '{}',
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Company subscriptions table
CREATE TABLE public.company_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled', 'expired')),
    billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start timestamp with time zone NOT NULL DEFAULT now(),
    current_period_end timestamp with time zone NOT NULL DEFAULT (now() + interval '1 month'),
    trial_ends_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(company_id)
);

-- Enable RLS on all tables
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.super_admins
        WHERE user_id = _user_id
          AND is_active = true
    )
$$;

-- Super admins policies - only super admins can access super_admins table
CREATE POLICY "Super admins can view all super admins"
ON public.super_admins
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage super admins"
ON public.super_admins
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Subscription plans policies - viewable by all authenticated, editable by super admins
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true OR is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Company subscriptions policies
CREATE POLICY "Company admins can view their subscription"
ON public.company_subscriptions
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all subscriptions"
ON public.company_subscriptions
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Add trigger for updated_at columns
CREATE TRIGGER update_super_admins_updated_at
BEFORE UPDATE ON public.super_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_subscriptions_updated_at
BEFORE UPDATE ON public.company_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant super admins access to view all companies (update existing policy)
CREATE POLICY "Super admins can view all companies"
ON public.companies
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all companies"
ON public.companies
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_users, max_departments, allowed_modules, features, sort_order)
VALUES 
    ('Free', 'Basic plan for small teams', 0, 0, 5, 2, ARRAY['HR_CORE', 'ADMIN'], '{"support": "email"}', 1),
    ('Starter', 'Perfect for growing teams', 29, 290, 25, 5, ARRAY['HR_CORE', 'ATTENDANCE', 'LEAVE', 'ADMIN'], '{"support": "email", "api_access": false}', 2),
    ('Professional', 'Full featured plan for businesses', 99, 990, 100, 20, ARRAY['HR_CORE', 'ATTENDANCE', 'LEAVE', 'FINANCE', 'COMPLIANCE', 'ADMIN'], '{"support": "priority", "api_access": true}', 3),
    ('Enterprise', 'Unlimited access for large organizations', 299, 2990, NULL, NULL, ARRAY['HR_CORE', 'ATTENDANCE', 'LEAVE', 'FINANCE', 'REVENUE', 'SALES_CRM', 'COMPLIANCE', 'ADMIN'], '{"support": "dedicated", "api_access": true, "sla": true}', 4);