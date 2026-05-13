'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme, colors } from '../layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfigType =
  | 'slack'
  | 'webhook'
  | 'zapier'
  | 'make'
  | 'n8n'
  | 'telegram'
  | 'hubspot'
  | 'notion'
  | 'pipedrive'
  | 'oauth'
  | 'soon';
type Category = 'alle' | 'kommunikation' | 'kalender' | 'crm' | 'email' | 'automatisierung' | 'daten';

interface FieldSpec {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'url';
  help: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: Exclude<Category, 'alle'>;
  configType: ConfigType;
  color: string;
  bg: string;
  icon: React.ReactNode;
  popular?: boolean;
}

type SavedConfigs = Record<string, Record<string, string>>;

// ─── Field specs per config type ──────────────────────────────────────────────

const FIELD_SPECS: Record<string, FieldSpec[]> = {
  slack: [
    {
      key: 'webhookUrl',
      label: 'Incoming Webhook URL',
      placeholder: 'https://hooks.slack.com/services/T.../B.../...',
      type: 'url',
      help: 'Slack App > Features > Incoming Webhooks > Add New Webhook',
    },
    {
      key: 'channel',
      label: 'Standard-Channel (optional)',
      placeholder: '#hot-leads',
      type: 'text',
      help: 'Kann auch direkt in der Slack App konfiguriert werden.',
    },
  ],
  webhook: [
    {
      key: 'url',
      label: 'Endpoint URL',
      placeholder: 'https://your-service.com/webhook',
      type: 'url',
      help: 'Das System sendet POST-Requests mit JSON-Payload an diese URL.',
    },
    {
      key: 'authHeader',
      label: 'Authorization Header (optional)',
      placeholder: 'Bearer sk-...',
      type: 'password',
      help: 'Wird als Authorization-Header bei jedem Request mitgesendet.',
    },
  ],
  zapier: [
    {
      key: 'webhookUrl',
      label: 'Zapier Webhook URL',
      placeholder: 'https://hooks.zapier.com/hooks/catch/...',
      type: 'url',
      help: 'Neuen Zap erstellen > Trigger: Webhooks by Zapier > Catch Hook',
    },
  ],
  make: [
    {
      key: 'webhookUrl',
      label: 'Make Webhook URL',
      placeholder: 'https://hook.eu1.make.com/...',
      type: 'url',
      help: 'Neues Szenario > Webhooks Modul als Trigger > Webhook-URL kopieren',
    },
  ],
  n8n: [
    {
      key: 'webhookUrl',
      label: 'n8n Webhook URL',
      placeholder: 'https://your-n8n.com/webhook/...',
      type: 'url',
      help: 'Webhook-Node in deinem n8n Workflow > Production URL',
    },
  ],
  telegram: [
    {
      key: 'botToken',
      label: 'Bot Token',
      placeholder: '1234567890:ABCDEFabcdef...',
      type: 'password',
      help: 'Telegram: /start beim @BotFather > /newbot > Token kopieren',
    },
    {
      key: 'chatId',
      label: 'Chat ID',
      placeholder: '-1001234567890',
      type: 'text',
      help: 'Bot in den Ziel-Chat einladen, dann @userinfobot fragen',
    },
  ],
  hubspot: [
    {
      key: 'accessToken',
      label: 'Private App Access Token',
      placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      type: 'password',
      help: 'HubSpot > Einstellungen > Integrationen > Private Apps > Neue App erstellen',
    },
  ],
  notion: [
    {
      key: 'token',
      label: 'Internal Integration Token',
      placeholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'password',
      help: 'notion.so/my-integrations > Neue Integration > Internes Integration-Token',
    },
    {
      key: 'databaseId',
      label: 'Datenbank ID',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'text',
      help: 'URL der Notion-Datenbank: notion.so/{workspace}/{DATABASE_ID}?v=...',
    },
  ],
  pipedrive: [
    {
      key: 'apiToken',
      label: 'API Token',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'password',
      help: 'Pipedrive > Einstellungen > Persönliche Einstellungen > API > API-Token',
    },
  ],
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function SlackIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 122 122" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.6 76.8c0 7.1-5.8 12.8-12.8 12.8S0 83.9 0 76.8s5.8-12.8 12.8-12.8H25.6v12.8z" fill="#E01E5A" />
      <path
        d="M32 76.8c0-7.1 5.8-12.8 12.8-12.8s12.8 5.8 12.8 12.8v32c0 7.1-5.8 12.8-12.8 12.8S32 115.9 32 108.8V76.8z"
        fill="#E01E5A"
      />
      <path d="M44.8 25.6c-7.1 0-12.8-5.8-12.8-12.8S37.7 0 44.8 0s12.8 5.8 12.8 12.8V25.6H44.8z" fill="#36C5F0" />
      <path
        d="M44.8 32c7.1 0 12.8 5.8 12.8 12.8S51.9 57.6 44.8 57.6H12.8C5.8 57.6 0 51.9 0 44.8S5.8 32 12.8 32h32z"
        fill="#36C5F0"
      />
      <path d="M96 44.8c0-7.1 5.8-12.8 12.8-12.8S121.6 37.7 121.6 44.8s-5.8 12.8-12.8 12.8H96V44.8z" fill="#2EB67D" />
      <path
        d="M89.6 44.8c0 7.1-5.8 12.8-12.8 12.8S64 51.9 64 44.8V12.8C64 5.8 69.8 0 76.8 0s12.8 5.8 12.8 12.8v32z"
        fill="#2EB67D"
      />
      <path d="M76.8 96c7.1 0 12.8 5.8 12.8 12.8s-5.8 12.8-12.8 12.8-12.8-5.8-12.8-12.8V96h12.8z" fill="#ECB22E" />
      <path
        d="M76.8 89.6c-7.1 0-12.8-5.8-12.8-12.8S69.7 64 76.8 64h32c7.1 0 12.8 5.8 12.8 12.8s-5.8 12.8-12.8 12.8h-32z"
        fill="#ECB22E"
      />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M15.5 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="#5059C9" />
      <path
        d="M13.5 9h5a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 18.5 17H17v2.5L14.5 17H13.5A1.5 1.5 0 0 1 12 15.5v-5A1.5 1.5 0 0 1 13.5 9z"
        fill="#5059C9"
      />
      <circle cx="9" cy="7.5" r="2.5" fill="#7B83EB" />
      <path
        d="M2.5 11A1.5 1.5 0 0 1 4 9.5h10A1.5 1.5 0 0 1 15.5 11v6a1.5 1.5 0 0 1-1.5 1.5H9.5L6 21.5V18.5H4A1.5 1.5 0 0 1 2.5 17V11z"
        fill="#7B83EB"
      />
      <text x="9" y="16" textAnchor="middle" fontSize="6" fontWeight="800" fill="#fff" fontFamily="sans-serif">
        T
      </text>
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#2D8CFF" />
      <rect x="5" y="9" width="13" height="10" rx="2" fill="#fff" />
      <path d="M18 12.5l5-3v9l-5-3V12.5z" fill="#fff" />
    </svg>
  );
}

function GoogleMeetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#00897B" />
      <rect x="5" y="9" width="12" height="10" rx="2" fill="#fff" />
      <path d="M17 12l6-3.5v11L17 16v-4z" fill="#fff" opacity=".8" />
    </svg>
  );
}

function GCalIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#fff" stroke="#E8ECF0" />
      <rect x="4" y="7" width="20" height="17" rx="2" fill="#fff" stroke="#E8ECF0" />
      <rect x="4" y="7" width="20" height="5" rx="2" fill="#4285F4" />
      <rect x="4" y="10" width="20" height="2" fill="#4285F4" />
      <line x1="9" y1="7" x2="9" y2="5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="7" x2="19" y2="5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="16" width="4" height="4" rx="1" fill="#34A853" />
    </svg>
  );
}

function OutlookCalIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#0072C6" />
      <rect x="5" y="7" width="18" height="15" rx="2" fill="#fff" opacity=".15" />
      <rect x="5" y="7" width="18" height="4" rx="1" fill="#fff" opacity=".3" />
      <rect x="9" y="15" width="4" height="4" rx="1" fill="#fff" />
      <text x="14" y="12" fontSize="7" fontWeight="800" fill="#fff" fontFamily="sans-serif" textAnchor="middle">
        CAL
      </text>
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#fff" stroke="#E8ECF0" />
      <path d="M4 9h20v12H4V9z" fill="#fff" />
      <path d="M4 9l10 7 10-7" stroke="#EA4335" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function OutlookMailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#0078D4" />
      <rect x="5" y="8" width="18" height="13" rx="2" fill="#fff" opacity=".2" />
      <path d="M5 10l9 6 9-6" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

function HubSpotIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#FF7A59" />
      <circle cx="17" cy="9" r="3" fill="#fff" />
      <circle cx="17" cy="9" r="1.5" fill="#FF7A59" />
      <path d="M14 9h-4a5 5 0 1 0 0 10h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SalesforceIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#00A1E0" />
      <path
        d="M14 7c-2.2 0-4 1.8-4 4 0 .3 0 .6.1.8C9 12 8 13.2 8 14.5c0 1.7 1.4 3 3 3h7c1.7 0 3-1.3 3-3s-1.3-3-3-3c-.1 0-.3 0-.4.1C17.5 10.6 16 9 14 9z"
        fill="#fff"
      />
    </svg>
  );
}

function PipedriveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#28A745" />
      <circle cx="14" cy="12" r="4" fill="#fff" />
      <rect x="11.5" y="16" width="5" height="7" rx="2.5" fill="#fff" />
    </svg>
  );
}

function ZapierIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#FF4A00" />
      <path d="M14 5l2 7h7l-5.5 4 2 7L14 19l-5.5 4 2-7L5 12h7l2-7z" fill="#fff" />
    </svg>
  );
}

function MakeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#6C2BD9" />
      <circle cx="8" cy="14" r="2.5" fill="#fff" />
      <circle cx="14" cy="14" r="2.5" fill="#fff" />
      <circle cx="20" cy="14" r="2.5" fill="#fff" />
    </svg>
  );
}

function N8nIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#EA4B71" />
      <text x="4" y="19" fontSize="12" fontWeight="900" fill="#fff" fontFamily="monospace">
        n8n
      </text>
    </svg>
  );
}

function WebhookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#0A2540" />
      <path d="M8 14c0-3.3 2.7-6 6-6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 14c0 3.3-2.7 6-6 6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#4F46E5" />
    </svg>
  );
}

function ApiIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#0A2540" />
      <text x="4" y="17" fontSize="10" fontWeight="800" fill="#4F46E5" fontFamily="monospace">
        API
      </text>
    </svg>
  );
}

function SheetsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#0F9D58" />
      <rect x="6" y="7" width="16" height="14" rx="1" fill="#fff" opacity=".2" />
      <rect x="6" y="7" width="16" height="4" fill="#fff" opacity=".3" />
      <line x1="6" y1="15" x2="22" y2="15" stroke="#fff" strokeOpacity=".3" />
      <line x1="14" y1="7" x2="14" y2="21" stroke="#fff" strokeOpacity=".3" />
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#fff" stroke="#E8ECF0" />
      <path d="M8 7h8l5 5v10H8V7z" fill="#fff" stroke="#0A2540" strokeWidth="1.5" />
      <path d="M16 7v5h5" stroke="#0A2540" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="10" y1="13" x2="18" y2="13" stroke="#0A2540" strokeWidth="1" opacity=".4" />
      <line x1="10" y1="16" x2="18" y2="16" stroke="#0A2540" strokeWidth="1" opacity=".4" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#26A5E4" />
      <path d="M6 13.5l16-6.5-3 13-5-4-3 3V15l8-7.5-9 5.5-4-1z" fill="#fff" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  // Kommunikation
  {
    id: 'slack',
    name: 'Slack',
    description: 'Empfange sofortige Benachrichtigungen für neue Hot Leads und Kaufsignale in deinem Workspace.',
    category: 'kommunikation',
    configType: 'slack',
    color: '#4A154B',
    bg: '#F5EEF5',
    icon: <SlackIcon />,
    popular: true,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Leite kritische Alerts wie neue Hot Leads oder Funding-Signale an einen Telegram-Bot weiter.',
    category: 'kommunikation',
    configType: 'telegram',
    color: '#26A5E4',
    bg: '#EAF6FD',
    icon: <TelegramIcon />,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Erstelle Meeting-Links direkt aus dem Lead-Profil und sende Benachrichtigungen in Teams-Channels.',
    category: 'kommunikation',
    configType: 'oauth',
    color: '#5059C9',
    bg: '#EEEEFF',
    icon: <TeamsIcon />,
    popular: true,
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Plane Zoom-Meetings für Demos und erhalte automatische Erinnerungen vor jedem Termin.',
    category: 'kommunikation',
    configType: 'oauth',
    color: '#2D8CFF',
    bg: '#EEF5FF',
    icon: <ZoomIcon />,
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    description: 'Erstelle Google Meet Links für Demos und synchronisiere Notizen mit dem Lead-Profil.',
    category: 'kommunikation',
    configType: 'oauth',
    color: '#00897B',
    bg: '#E6F4F1',
    icon: <GoogleMeetIcon />,
  },

  // Kalender
  {
    id: 'gcal',
    name: 'Google Calendar',
    description: 'Synchronisiere Termine mit deinem Google Kalender und erhalte automatische Meeting-Vorbereitung.',
    category: 'kalender',
    configType: 'oauth',
    color: '#4285F4',
    bg: '#EEF3FE',
    icon: <GCalIcon />,
    popular: true,
  },
  {
    id: 'outlook-cal',
    name: 'Outlook Calendar',
    description: 'Verbinde deinen Outlook-Kalender für automatische Termin-Synchronisation und Reminder.',
    category: 'kalender',
    configType: 'oauth',
    color: '#0072C6',
    bg: '#E6F1FB',
    icon: <OutlookCalIcon />,
  },

  // CRM
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Exportiere qualifizierte Leads direkt in HubSpot und synchronisiere Deal-Status bidirektional.',
    category: 'crm',
    configType: 'hubspot',
    color: '#FF7A59',
    bg: '#FFF0EB',
    icon: <HubSpotIcon />,
    popular: true,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Erstelle automatisch neue Deals in Pipedrive wenn ein Lead den Hot-Status erreicht.',
    category: 'crm',
    configType: 'pipedrive',
    color: '#28A745',
    bg: '#E8F5EC',
    icon: <PipedriveIcon />,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Speichere Lead-Profile und Gesprächsnotizen in deiner Notion-Datenbank.',
    category: 'crm',
    configType: 'notion',
    color: '#0A2540',
    bg: '#F1F5F9',
    icon: <NotionIcon />,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Pushe vollständig angereicherte Lead-Daten direkt in dein Salesforce CRM.',
    category: 'crm',
    configType: 'oauth',
    color: '#00A1E0',
    bg: '#E6F5FC',
    icon: <SalesforceIcon />,
    popular: true,
  },

  // E-Mail
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Sende personalisierte Outreach-E-Mails direkt aus dem Lead-Profil und tracke Öffnungen.',
    category: 'email',
    configType: 'oauth',
    color: '#EA4335',
    bg: '#FEF0EE',
    icon: <GmailIcon />,
    popular: true,
  },
  {
    id: 'outlook-mail',
    name: 'Outlook Mail',
    description: 'Verbinde dein Outlook-Postfach für direkten E-Mail-Versand und Antwort-Tracking.',
    category: 'email',
    configType: 'oauth',
    color: '#0078D4',
    bg: '#E6F1FB',
    icon: <OutlookMailIcon />,
  },

  // Automatisierung
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Verbinde deine Leads mit 5.000+ Apps. Trigger auf neue Leads, Signale oder Status-Änderungen.',
    category: 'automatisierung',
    configType: 'zapier',
    color: '#FF4A00',
    bg: '#FFF0EB',
    icon: <ZapierIcon />,
    popular: true,
  },
  {
    id: 'make',
    name: 'Make',
    description: 'Baue visuelle Automatisierungen — z.B. neuer Hot Lead → CRM → Slack → Kalender-Eintrag.',
    category: 'automatisierung',
    configType: 'make',
    color: '#6C2BD9',
    bg: '#F2EEFB',
    icon: <MakeIcon />,
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Self-hosted Workflow-Automatisierung. Nutze den Webhook-Trigger für deine eigenen Flows.',
    category: 'automatisierung',
    configType: 'n8n',
    color: '#EA4B71',
    bg: '#FEF0F4',
    icon: <N8nIcon />,
  },

  // Daten
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Empfange Echtzeit-Events für neue Leads, Kaufsignale und Deal-Änderungen in deiner App.',
    category: 'daten',
    configType: 'webhook',
    color: '#4F46E5',
    bg: '#EEF0FF',
    icon: <WebhookIcon />,
    popular: true,
  },
  {
    id: 'api',
    name: 'REST API',
    description: 'Direkter Datenzugriff per REST API. Dokumentation und API-Key-Verwaltung inklusive.',
    category: 'daten',
    configType: 'webhook',
    color: '#0A2540',
    bg: '#F1F5F9',
    icon: <ApiIcon />,
    popular: true,
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    description: 'Exportiere Lead-Listen automatisch in Google Sheets — stündlich, täglich oder on-demand.',
    category: 'daten',
    configType: 'oauth',
    color: '#0F9D58',
    bg: '#E6F5EE',
    icon: <SheetsIcon />,
  },
];

const CATEGORY_LABELS: Record<Category, string> = {
  alle: 'Alle',
  kommunikation: 'Kommunikation',
  kalender: 'Kalender',
  crm: 'CRM',
  email: 'E-Mail',
  automatisierung: 'Automatisierung',
  daten: 'Daten & API',
};

const STORAGE_KEY = 'onvero_integration_configs';

// ─── Connect Drawer ───────────────────────────────────────────────────────────

function ConnectDrawer({
  integration,
  savedConfig,
  onSave,
  onDisconnect,
  onClose,
  c,
  isDark,
}: {
  integration: Integration;
  savedConfig: Record<string, string> | undefined;
  onSave: (id: string, config: Record<string, string>) => void;
  onDisconnect: (id: string) => void;
  onClose: () => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const fields = FIELD_SPECS[integration.configType] ?? [];
  const isConnected = !!savedConfig;
  const [form, setForm] = useState<Record<string, string>>(savedConfig ?? {});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const allFilled = fields.filter((f) => !f.help.includes('optional')).every((f) => !!form[f.key]?.trim());

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configType: integration.configType, config: form }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: 'Netzwerkfehler. Bitte erneut versuchen.' });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    onSave(integration.id, form);
    setTestResult(null);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(10,37,64,0.25)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 460,
          background: c.bgCard,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark ? '-8px 0 40px rgba(0,0,0,0.4)' : '-8px 0 40px rgba(10,37,64,0.12)',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: integration.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {integration.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: c.text }}>{integration.name}</span>
              {isConnected && (
                <span
                  style={{
                    padding: '2px 8px',
                    background: '#ECFDF5',
                    color: '#059669',
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Verbunden
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: c.textSub, margin: '4px 0 0', lineHeight: 1.5 }}>
              {integration.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              border: `1px solid ${c.border}`,
              borderRadius: 7,
              background: c.bgCard,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: c.textSub,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {integration.configType === 'oauth' ? (
            <div
              style={{
                background: c.bgPage,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: '20px 22px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isDark ? c.accent + '20' : '#EEF0FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={c.accent}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: c.text, marginBottom: 6 }}>OAuth-Verbindung</div>
              <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.6, margin: '0 0 16px' }}>
                Diese Integration benötigt eine OAuth-Authentifizierung. Wir arbeiten daran und machen sie bald
                verfügbar.
              </p>
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  background: c.bgHover,
                  color: c.textSub,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Demnächst verfügbar
              </div>
            </div>
          ) : (
            <>
              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {fields.map((field) => (
                  <div key={field.key}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 700,
                        color: c.text,
                        marginBottom: 6,
                      }}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key] ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1.5px solid ${c.border}`,
                        borderRadius: 9,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: c.text,
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: c.bgPage,
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = c.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                    />
                    {field.help && (
                      <p style={{ fontSize: 11, color: c.textSub, margin: '5px 0 0', lineHeight: 1.5 }}>{field.help}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Test result */}
              {testResult && (
                <div
                  style={{
                    marginTop: 20,
                    padding: '12px 14px',
                    background: testResult.ok ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${testResult.ok ? '#A7F3D0' : '#FECACA'}`,
                    borderRadius: 9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: testResult.ok ? '#059669' : '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {testResult.ok ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    ) : (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="2" y1="2" x2="10" y2="10" />
                        <line x1="10" y1="2" x2="2" y2="10" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: testResult.ok ? '#059669' : '#DC2626' }}>
                    {testResult.message}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {integration.configType !== 'oauth' && (
          <div
            style={{
              padding: '16px 28px',
              borderTop: `1px solid ${c.border}`,
              display: 'flex',
              gap: 10,
            }}
          >
            {isConnected && (
              <button
                onClick={() => {
                  onDisconnect(integration.id);
                  onClose();
                }}
                style={{
                  padding: '9px 16px',
                  background: c.bgCard,
                  border: '1.5px solid #FECACA',
                  color: '#DC2626',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Trennen
              </button>
            )}
            <button
              onClick={handleTest}
              disabled={testing || !allFilled}
              style={{
                flex: 1,
                padding: '9px 16px',
                background: c.bgPage,
                border: `1.5px solid ${c.border}`,
                color: testing || !allFilled ? c.textMuted : c.text,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                cursor: testing || !allFilled ? 'default' : 'pointer',
                fontFamily: 'inherit',
                transition: 'opacity 0.15s',
              }}
            >
              {testing ? 'Teste...' : 'Verbindung testen'}
            </button>
            <button
              onClick={handleSave}
              disabled={!allFilled}
              style={{
                flex: 1,
                padding: '9px 16px',
                background: allFilled ? c.accent : c.border,
                border: 'none',
                color: allFilled ? '#fff' : c.textMuted,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                cursor: allFilled ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              {isConnected ? 'Speichern' : 'Verbinden'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Integration card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  connected,
  onOpen,
  c,
  isDark,
}: {
  integration: Integration;
  connected: boolean;
  onOpen: (id: string) => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isOauth = integration.configType === 'oauth';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.bgCard,
        border: connected
          ? '1.5px solid #6EE7B7'
          : `1px solid ${hovered ? (isDark ? c.accent + '60' : '#C7D2FE') : c.border}`,
        borderRadius: 16,
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        opacity: isOauth ? 0.75 : 1,
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: hovered && !isOauth ? `0 4px 20px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(10,37,64,0.08)'}` : 'none',
      }}
    >
      {/* Badges */}
      {integration.popular && !connected && !isOauth && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            padding: '2px 8px',
            background: '#FFF7ED',
            color: '#D97706',
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          Beliebt
        </div>
      )}
      {connected && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        </div>
      )}
      {isOauth && !connected && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            padding: '2px 8px',
            background: c.bgHover,
            color: c.textSub,
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          OAuth
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flexShrink: 0 }}>{integration.icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>{integration.name}</div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 3,
              padding: '1px 7px',
              background: integration.bg,
              color: integration.color,
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}
          >
            {CATEGORY_LABELS[integration.category]}
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.6, margin: 0, flex: 1 }}>{integration.description}</p>

      {/* Button */}
      <button
        onClick={() => !isOauth && onOpen(integration.id)}
        disabled={isOauth}
        style={{
          width: '100%',
          padding: '9px',
          border: connected ? '1.5px solid #6EE7B7' : 'none',
          borderRadius: 9,
          fontSize: 13,
          fontWeight: 700,
          cursor: isOauth ? 'default' : 'pointer',
          background: connected ? '#F0FDF4' : isOauth ? c.bgHover : c.accent,
          color: connected ? '#059669' : isOauth ? c.textMuted : '#fff',
          fontFamily: 'var(--font-inter), sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        {connected && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
        {connected ? 'Verbunden' : isOauth ? 'Demnächst' : 'Verbinden'}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [category, setCategory] = useState<Category>('alle');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<SavedConfigs>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfigs(JSON.parse(raw) as SavedConfigs);
    } catch {
      // ignore
    }
  }, []);

  const saveConfig = useCallback((id: string, config: Record<string, string>) => {
    setConfigs((prev) => {
      const next = { ...prev, [id]: config };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeConfig = useCallback((id: string) => {
    setConfigs((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const activeIntegration = activeId ? (INTEGRATIONS.find((i) => i.id === activeId) ?? null) : null;

  const filtered = INTEGRATIONS.filter((i) => {
    const matchCat = category === 'alle' || i.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const connectedIds = new Set(Object.keys(configs));
  const connectedCount = connectedIds.size;
  const availableCount = INTEGRATIONS.filter((i) => i.configType !== 'oauth' && !connectedIds.has(i.id)).length;
  const oauthCount = INTEGRATIONS.filter((i) => i.configType === 'oauth').length;

  const connectedFiltered = filtered.filter((i) => connectedIds.has(i.id));
  const restFiltered = filtered
    .filter((i) => !connectedIds.has(i.id))
    .sort((a, b) => {
      const aWorking = a.configType !== 'oauth' ? 0 : 1;
      const bWorking = b.configType !== 'oauth' ? 0 : 1;
      return aWorking - bWorking;
    });

  return (
    <div
      style={{
        minHeight: '100%',
        background: c.bgPage,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1C1D26 0%, #13141A 100%)'
            : 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
          borderBottom: `1px solid ${c.border}`,
          padding: '28px 40px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isDark ? c.accent + '20' : '#EEF0FF',
              color: c.accent,
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 14,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.accent }} />
            {connectedCount > 0 ? `${connectedCount} verbunden` : 'Keine aktiv'}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: c.text, margin: '0 0 8px', lineHeight: 1.25 }}>
            Integrationen
          </h1>
          <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 440 }}>
            Verbinde deine Leads mit bestehenden Tools. {availableCount} Integrationen sofort verfügbar.
          </p>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke={c.textMuted}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <circle cx="6.5" cy="6.5" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            <input
              placeholder="Integration suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 13px 9px 32px',
                border: `1.5px solid ${c.border}`,
                borderRadius: 9,
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                background: c.bgCard,
                color: c.text,
                boxSizing: 'border-box' as const,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
          {[
            { label: 'Verbunden', value: connectedCount, color: '#059669', bg: isDark ? '#059669' + '20' : '#ECFDF5' },
            { label: 'Verfügbar', value: availableCount, color: c.accent, bg: isDark ? c.accent + '20' : '#EEF0FF' },
            { label: 'OAuth', value: oauthCount, color: c.textSub, bg: c.bgHover },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center' as const,
                padding: '10px 16px',
                background: s.bg,
                borderRadius: 12,
                minWidth: 64,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div
                style={{
                  fontSize: 10,
                  color: s.color,
                  marginTop: 3,
                  fontWeight: 700,
                  opacity: 0.7,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div
        style={{
          background: c.bgCard,
          borderBottom: `1px solid ${c.border}`,
          padding: '0 40px',
          display: 'flex',
          gap: 0,
          overflowX: 'auto' as const,
        }}
      >
        {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => {
          const count = key === 'alle' ? INTEGRATIONS.length : INTEGRATIONS.filter((i) => i.category === key).length;
          const active = category === key;
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                padding: '13px 16px',
                border: 'none',
                borderBottom: active ? `2.5px solid ${c.accent}` : '2.5px solid transparent',
                background: 'transparent',
                fontSize: 13,
                fontWeight: active ? 800 : 600,
                color: active ? c.accent : c.textSub,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap' as const,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'color 0.15s',
              }}
            >
              {label}
              <span
                style={{
                  padding: '1px 6px',
                  background: active ? (isDark ? c.accent + '20' : '#EEF0FF') : c.bgHover,
                  color: active ? c.accent : c.textSub,
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ padding: '28px 40px 40px' }}>
        {/* Import card */}
        {category === 'alle' && (
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: c.textSub,
                margin: '0 0 12px',
              }}
            >
              Daten importieren
            </p>
            <a href="/intelligence/import" style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, ' + c.accent + '18 0%, ' + c.accent + '08 100%)'
                    : 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 100%)',
                  border: `1.5px solid ${isDark ? c.accent + '40' : '#C7D2FE'}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(79,70,229,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: c.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c.text, marginBottom: 3 }}>
                    Eigene Leads importieren & anreichern
                  </div>
                  <div style={{ fontSize: 12, color: c.textSub, lineHeight: 1.5 }}>
                    CSV-Datei hochladen, Spalten zuordnen — alle Firmendaten werden automatisch ergänzt.
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    background: c.accent,
                    color: '#fff',
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  Import starten
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          </div>
        )}
        {/* Connected */}
        {category === 'alle' && connectedFiltered.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: '#059669',
                margin: '0 0 12px',
              }}
            >
              Aktive Verbindungen
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {connectedFiltered.map((i) => (
                <IntegrationCard
                  key={i.id}
                  integration={i}
                  connected={true}
                  onOpen={setActiveId}
                  c={c}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        )}

        {/* Working integrations */}
        {restFiltered.filter((i) => i.configType !== 'oauth').length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: c.textSub,
                margin: '0 0 12px',
              }}
            >
              Jetzt verbinden
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {restFiltered
                .filter((i) => i.configType !== 'oauth')
                .map((i) => (
                  <IntegrationCard
                    key={i.id}
                    integration={i}
                    connected={false}
                    onOpen={setActiveId}
                    c={c}
                    isDark={isDark}
                  />
                ))}
            </div>
          </div>
        )}

        {/* OAuth integrations */}
        {restFiltered.filter((i) => i.configType === 'oauth').length > 0 && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: c.textMuted,
                margin: '0 0 12px',
              }}
            >
              Demnächst — OAuth erforderlich
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {restFiltered
                .filter((i) => i.configType === 'oauth')
                .map((i) => (
                  <IntegrationCard
                    key={i.id}
                    integration={i}
                    connected={false}
                    onOpen={setActiveId}
                    c={c}
                    isDark={isDark}
                  />
                ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center' as const, padding: '64px', color: c.textSub, fontSize: 14 }}>
            Keine Integrationen gefunden.
          </div>
        )}
      </div>

      {/* Drawer */}
      {activeIntegration && (
        <ConnectDrawer
          integration={activeIntegration}
          savedConfig={configs[activeIntegration.id]}
          onSave={saveConfig}
          onDisconnect={removeConfig}
          onClose={() => setActiveId(null)}
          c={c}
          isDark={isDark}
        />
      )}
    </div>
  );
}
