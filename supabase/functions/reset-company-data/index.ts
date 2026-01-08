import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if requesting user is a company admin
    const { data: isAdmin } = await supabaseAdmin.rpc('is_company_admin', { _user_id: requestingUser.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Not authorized. Only company admins can reset company data." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { confirmation } = await req.json();

    if (confirmation !== 'RESET ALL DATA') {
      return new Response(
        JSON.stringify({ error: "Invalid confirmation. Please type 'RESET ALL DATA' to confirm." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get company ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('id', requestingUser.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const companyId = profile.company_id;

    // Get all profile IDs for this company
    const { data: companyProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('company_id', companyId);

    const profileIds = companyProfiles?.map(p => p.id) || [];
    const otherProfileIds = profileIds.filter(id => id !== requestingUser.id);

    if (profileIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No profiles found for company" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete data in order (respecting foreign key constraints)
    // Note: We keep the admin user, company, and basic settings

    // 1. Delete payroll data
    if (profileIds.length > 0) {
      const { data: salaries } = await supabaseAdmin
        .from('employee_salaries')
        .select('id')
        .in('profile_id', profileIds);
      
      if (salaries && salaries.length > 0) {
        await supabaseAdmin.from('employee_salary_components').delete().in('employee_salary_id', salaries.map(s => s.id));
        await supabaseAdmin.from('employee_salaries').delete().in('profile_id', profileIds);
      }
    }
    await supabaseAdmin.from('payroll_runs').delete().eq('company_id', companyId);

    // 2. Delete expenses
    await supabaseAdmin.from('expenses').delete().eq('company_id', companyId);
    await supabaseAdmin.from('expense_categories').delete().eq('company_id', companyId);

    // 3. Delete leave data
    await supabaseAdmin.from('leave_requests').delete().in('profile_id', profileIds);
    await supabaseAdmin.from('leave_balances').delete().in('profile_id', profileIds);
    await supabaseAdmin.from('leave_types').delete().eq('company_id', companyId);

    // 4. Delete attendance data
    await supabaseAdmin.from('attendance_overrides').delete().in('profile_id', profileIds);
    await supabaseAdmin.from('attendance_punches').delete().in('profile_id', profileIds);
    await supabaseAdmin.from('attendance').delete().in('profile_id', profileIds);

    // 5. Delete onboarding data
    const { data: onboardings } = await supabaseAdmin
      .from('employee_onboarding')
      .select('id')
      .in('profile_id', profileIds);
    
    if (onboardings && onboardings.length > 0) {
      await supabaseAdmin.from('employee_onboarding_items').delete().in('onboarding_id', onboardings.map(o => o.id));
    }
    await supabaseAdmin.from('employee_onboarding').delete().in('profile_id', profileIds);

    const { data: templates } = await supabaseAdmin
      .from('onboarding_templates')
      .select('id')
      .eq('company_id', companyId);
    
    if (templates && templates.length > 0) {
      await supabaseAdmin.from('onboarding_template_items').delete().in('template_id', templates.map(t => t.id));
    }
    await supabaseAdmin.from('onboarding_templates').delete().eq('company_id', companyId);

    // 6. Delete employee details (except for admin)
    if (otherProfileIds.length > 0) {
      await supabaseAdmin.from('employee_details').delete().in('profile_id', otherProfileIds);
    }

    // 7. Delete notifications
    await supabaseAdmin.from('notifications').delete().in('profile_id', profileIds);

    // 8. Delete audit logs
    await supabaseAdmin.from('audit_logs').delete().eq('company_id', companyId);

    // 9. Delete users from auth (except admin)
    let deletedCount = 0;
    for (const userId of otherProfileIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        deletedCount++;
      } catch (e) {
        console.error(`Failed to delete user ${userId}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "All company data has been reset successfully. Your admin account and company settings have been preserved.",
        deleted_users: deletedCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in reset-company-data function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
