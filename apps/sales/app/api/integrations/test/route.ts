import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

type TestBody = {
  configType: string;
  config: Record<string, string>;
};

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ ok: false, message: 'Nicht autorisiert.' }, { status: 401 });

  let body: TestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültiger Request.' }, { status: 400 });
  }

  const { configType, config } = body;

  try {
    switch (configType) {
      case 'slack': {
        if (!config.webhookUrl?.startsWith('https://hooks.slack.com/')) {
          return NextResponse.json({ ok: false, message: 'Keine gültige Slack Webhook-URL.' });
        }
        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Onvero Leads: Verbindungstest erfolgreich.' }),
        });
        if (!res.ok) return NextResponse.json({ ok: false, message: `Slack Fehler: ${res.status}` });
        return NextResponse.json({ ok: true, message: 'Testnachricht an Slack gesendet.' });
      }

      case 'webhook':
      case 'zapier':
      case 'make':
      case 'n8n': {
        const url = config.webhookUrl || config.url;
        if (!url) return NextResponse.json({ ok: false, message: 'Keine URL angegeben.' });
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (config.authHeader) headers['Authorization'] = config.authHeader;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'test',
            source: 'onvero_leads',
            timestamp: new Date().toISOString(),
          }),
        });
        if (res.status >= 500) {
          return NextResponse.json({ ok: false, message: `Server Fehler: ${res.status}` });
        }
        return NextResponse.json({ ok: true, message: 'Test-Event erfolgreich gesendet.' });
      }

      case 'telegram': {
        if (!config.botToken || !config.chatId) {
          return NextResponse.json({ ok: false, message: 'Bot-Token und Chat-ID sind erforderlich.' });
        }
        const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: 'Onvero Leads: Verbindungstest erfolgreich.',
          }),
        });
        const data = (await res.json()) as { ok: boolean; description?: string };
        if (!data.ok) {
          return NextResponse.json({ ok: false, message: data.description ?? 'Telegram Fehler.' });
        }
        return NextResponse.json({ ok: true, message: 'Testnachricht an Telegram gesendet.' });
      }

      case 'hubspot': {
        if (!config.accessToken) {
          return NextResponse.json({ ok: false, message: 'Access Token fehlt.' });
        }
        const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        });
        if (res.status === 401) {
          return NextResponse.json({ ok: false, message: 'Token ungültig oder abgelaufen.' });
        }
        if (!res.ok) {
          return NextResponse.json({ ok: false, message: `HubSpot Fehler: ${res.status}` });
        }
        return NextResponse.json({ ok: true, message: 'Verbindung zu HubSpot bestätigt.' });
      }

      case 'notion': {
        if (!config.token) {
          return NextResponse.json({ ok: false, message: 'Integration Token fehlt.' });
        }
        const res = await fetch('https://api.notion.com/v1/users/me', {
          headers: {
            Authorization: `Bearer ${config.token}`,
            'Notion-Version': '2022-06-28',
          },
        });
        if (res.status === 401) {
          return NextResponse.json({ ok: false, message: 'Token ungültig.' });
        }
        if (!res.ok) {
          return NextResponse.json({ ok: false, message: `Notion Fehler: ${res.status}` });
        }
        return NextResponse.json({ ok: true, message: 'Verbindung zu Notion bestätigt.' });
      }

      case 'pipedrive': {
        if (!config.apiToken) {
          return NextResponse.json({ ok: false, message: 'API Token fehlt.' });
        }
        const res = await fetch(`https://api.pipedrive.com/v1/users/me?api_token=${config.apiToken}`);
        if (res.status === 401) {
          return NextResponse.json({ ok: false, message: 'API Token ungültig.' });
        }
        if (!res.ok) {
          return NextResponse.json({ ok: false, message: `Pipedrive Fehler: ${res.status}` });
        }
        return NextResponse.json({ ok: true, message: 'Verbindung zu Pipedrive bestätigt.' });
      }

      default:
        return NextResponse.json({ ok: false, message: 'Unbekannter Integrationstyp.' });
    }
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'Verbindung fehlgeschlagen. URL erreichbar?',
    });
  }
}
