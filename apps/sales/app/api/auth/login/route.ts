import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich.' }, { status: 400 });
    }

    // Authenticate with Supabase
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData, error: authError } = await anon.auth.signInWithPassword({ email, password });

    if (authError || !authData.session) {
      return NextResponse.json({ error: authError?.message ?? 'Ungültige Anmeldedaten.' }, { status: 401 });
    }

    const userId = authData.user.id;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get tenant membership
    const { data: memberships } = await admin.from('tenant_users').select('tenant_id, role').eq('user_id', userId);

    const rolePriority: Record<string, number> = { owner: 3, admin: 2, member: 1 };
    const membership = memberships?.sort((a, b) => (rolePriority[b.role] ?? 0) - (rolePriority[a.role] ?? 0))?.[0];

    if (!membership) {
      return NextResponse.json({ error: 'Kein Tenant gefunden.' }, { status: 403 });
    }

    const tenantId = membership.tenant_id;
    const role = membership.role;

    // Bootstrap tenant rows if they don't exist yet
    try {
      const [{ data: existingIntegration }, { data: existingProfile }, { data: existingPrefs }] = await Promise.all([
        admin.from('tenant_integrations').select('id').eq('tenant_id', tenantId).maybeSingle(),
        admin.from('tenant_ai_profile').select('id').eq('tenant_id', tenantId).maybeSingle(),
        admin.from('tenant_preferences').select('id').eq('tenant_id', tenantId).maybeSingle(),
      ]);

      await Promise.all([
        !existingIntegration &&
          admin.from('tenant_integrations').insert({
            tenant_id: tenantId,
            provider: 'default',
            platform: 'analytics',
            config: {},
            follow_up_email: false,
          }),
        !existingProfile &&
          admin.from('tenant_ai_profile').insert({
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
          }),
        !existingPrefs &&
          admin.from('tenant_preferences').insert({
            tenant_id: tenantId,
            automatic_followup_emails: false,
            logo_url: null,
          }),
      ]);
    } catch (e) {
      console.error('[login] tenant bootstrap failed:', e);
    }

    // Get display name from profiles table
    const { data: profile } = await admin.from('profiles').select('first_name, last_name').eq('id', userId).single();

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      maxAge,
      path: '/',
    };

    const response = NextResponse.json({ success: true });

    // Session cookie: userId + tenantId + role (used by getSalesSessionContext)
    response.cookies.set('onvero_session', encodeURIComponent(JSON.stringify({ userId, tenantId, role })), cookieOpts);

    // User display cookie (non-sensitive, used by UI)
    response.cookies.set(
      'onvero_user',
      encodeURIComponent(
        JSON.stringify({
          firstName: profile?.first_name ?? '',
          lastName: profile?.last_name ?? '',
          email: authData.user.email ?? email,
        })
      ),
      cookieOpts
    );

    return response;
  } catch (e) {
    console.error('[login] error:', e);
    return NextResponse.json({ error: 'Server-Fehler.' }, { status: 500 });
  }
}
