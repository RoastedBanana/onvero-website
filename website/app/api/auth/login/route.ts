import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? 'Ungültige Anmeldedaten.' },
        { status: 401 }
      );
    }

    // Try to get first/last name from profiles table, fall back to form values
    let profileFirstName = firstName || '';
    let profileLastName = lastName || '';

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      profileFirstName = profile.first_name || firstName || '';
      profileLastName = profile.last_name || lastName || '';
    }

    // Ensure tenant_integrations and tenant_ai_profile rows exist for this user's tenant.
    // Uses service role so RLS can't block first-time creation.
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
        const { data: membership } = await admin
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (membership?.tenant_id) {
          const tenantId = membership.tenant_id;

          // tenant_integrations
          const { data: existingIntegration } = await admin
            .from('tenant_integrations')
            .select('id')
            .eq('tenant_id', tenantId)
            .maybeSingle();

          if (!existingIntegration) {
            await admin.from('tenant_integrations').insert({
              tenant_id: tenantId,
              provider: 'default',
              platform: 'analytics',
              config: {},
              follow_up_email: false,
            });
          }

          // tenant_ai_profile — create empty row so all columns are present
          const { data: existingProfile } = await admin
            .from('tenant_ai_profile')
            .select('id')
            .eq('tenant_id', tenantId)
            .maybeSingle();

          if (!existingProfile) {
            await admin.from('tenant_ai_profile').insert({
              tenant_id: tenantId,
              company_name: '',
              company_description: '',
              company_location: '',
              website: '',
              websites: [],
              industry: '',
              target_customers: '',
              ideal_lead_profile: '',
              excluded_profiles: '',
              services: [],
              usp: '',
              deal_size_min: null,
              deal_size_max: null,
              sales_cycle_days: null,
              tone_of_voice: '',
              email_signature: '',
              sender_name: '',
              sender_role: '',
              ai_search_prompt: '',
              ai_scoring_prompt: '',
              website_summary: '',
              onboarding_completed: false,
            });
          }

          // tenant_preferences — also ensure exists for logo / followup settings
          const { data: existingPrefs } = await admin
            .from('tenant_preferences')
            .select('id')
            .eq('tenant_id', tenantId)
            .maybeSingle();

          if (!existingPrefs) {
            await admin.from('tenant_preferences').insert({
              tenant_id: tenantId,
              automatic_followup_emails: false,
              logo_url: null,
            });
          }
        }
      }
    } catch (e) {
      console.error('[login] tenant bootstrap failed:', e);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    // Supabase SSR has already set its own auth cookies via createServerSupabaseClient.
    // We additionally set a user-info cookie for the client UI (no sensitive data).
    const response = NextResponse.json({ success: true });

    response.cookies.set(
      'onvero_user',
      encodeURIComponent(
        JSON.stringify({
          firstName: profileFirstName,
          lastName: profileLastName,
          email: data.user.email || email,
        })
      ),
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge,
        path: '/',
      }
    );

    return response;
  } catch {
    return NextResponse.json({ error: 'Server-Fehler.' }, { status: 500 });
  }
}
