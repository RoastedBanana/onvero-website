'use client';

import { useState, useCallback, useEffect } from 'react';
import { useOnboarding } from '../_onboarding';
import { useTheme, colors } from '../layout';

const INDUSTRIES = [
  'Mode & Bekleidung',
  'Sport & Outdoor',
  'Elektronik & Technik',
  'Haushalt & Living',
  'Baby & Kinder',
  'Garten & Pflanzen',
  'Fahrrad & Mobilität',
  'Haustier & Zubehör',
  'Spielzeug & Hobby',
  'Auto & Zubehör',
  'Büro & B2B',
  'Lebensmittel & FMCG',
  'Pharma & Gesundheit',
  'Schmuck & Luxus',
];
const SYSTEMS = [
  'Shopify',
  'Shopware 5',
  'Shopware 6',
  'WooCommerce',
  'JTL',
  'Plentymarkets',
  'Magento',
  'Oxid',
  'Salesforce Commerce',
  'SAP Commerce',
];
const CARRIERS = ['DHL', 'DPD', 'Hermes / evri', 'GLS', 'UPS', 'FedEx', 'DB Schenker', 'TNT', 'Colis Privé'];
const GEOGRAPHIES = ['Deutschland', 'Österreich', 'Schweiz'];
const BUNDESLAENDER = [
  'Bayern',
  'NRW',
  'Baden-Württemberg',
  'Hessen',
  'Hamburg',
  'Berlin',
  'Sachsen',
  'Niedersachsen',
  'Brandenburg',
  'Schleswig-Holstein',
];

function Section({
  title,
  sub,
  children,
  c,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: c.textSub, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function Toggle({
  label,
  sub,
  value,
  onChange,
  c,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: c.textSub, marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 99,
          border: 'none',
          cursor: 'pointer',
          background: value ? c.accent : c.borderStrong,
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  unit,
  c,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: c.accent, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: c.textSub }}>
          {min}
          {unit}
        </span>
        <span style={{ fontSize: 11, color: c.textSub }}>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  // ICP defaults
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([
    'Mode & Bekleidung',
    'Sport & Outdoor',
    'Elektronik & Technik',
    'Haushalt & Living',
  ]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>(['Shopify', 'Shopware 6', 'WooCommerce', 'JTL']);
  const [selectedGeographies, setSelectedGeographies] = useState<string[]>(['Deutschland', 'Österreich', 'Schweiz']);
  const [selectedBundeslaender, setSelectedBundeslaender] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState(100);
  const [maxVolume, setMaxVolume] = useState(3000);
  const [targetCarriers, setTargetCarriers] = useState<string[]>(['DHL', 'DPD', 'Hermes / evri', 'GLS']);
  const [excludedCarriers, setExcludedCarriers] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(65);
  const [fitWeight, setFitWeight] = useState(40);
  const [volumeWeight, setVolumeWeight] = useState(35);
  const [timingWeight, setTimingWeight] = useState(25);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyHot, setNotifyHot] = useState(true);
  const [notifyNewLayer, setNotifyNewLayer] = useState(false);
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [loaded, setLoaded] = useState(false);

  const { refresh } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load saved profile on mount
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return;
        const icp = profile.icp_config ?? {};
        const w = profile.scoring_weights ?? {};
        const n = profile.notifications_config ?? {};
        if (Array.isArray(icp.industries) && icp.industries.length) setSelectedIndustries(icp.industries);
        if (Array.isArray(icp.systems) && icp.systems.length) setSelectedSystems(icp.systems);
        if (Array.isArray(icp.geographies) && icp.geographies.length) setSelectedGeographies(icp.geographies);
        if (Array.isArray(icp.bundeslaender)) setSelectedBundeslaender(icp.bundeslaender);
        if (typeof icp.min_volume === 'number') setMinVolume(icp.min_volume);
        if (typeof icp.max_volume === 'number') setMaxVolume(icp.max_volume);
        if (Array.isArray(icp.target_carriers) && icp.target_carriers.length) setTargetCarriers(icp.target_carriers);
        if (Array.isArray(icp.excluded_carriers)) setExcludedCarriers(icp.excluded_carriers);
        if (typeof icp.min_score === 'number') setMinScore(icp.min_score);
        if (typeof w.fit === 'number') setFitWeight(w.fit);
        if (typeof w.volume === 'number') setVolumeWeight(w.volume);
        if (typeof w.timing === 'number') setTimingWeight(w.timing);
        if (typeof n.slack_webhook === 'string') setSlackWebhook(n.slack_webhook);
        if (typeof n.notify_email === 'string') setNotifyEmail(n.notify_email);
        if (typeof n.notify_hot === 'boolean') setNotifyHot(n.notify_hot);
        if (typeof n.notify_new_layer === 'boolean') setNotifyNewLayer(n.notify_new_layer);
        if (typeof n.notify_weekly === 'boolean') setNotifyWeekly(n.notify_weekly);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const totalWeight = fitWeight + volumeWeight + timingWeight;

  function setWeightBalanced(field: 'fit' | 'volume' | 'timing', newVal: number) {
    const remaining = 100 - newVal;
    if (field === 'fit') {
      const total = volumeWeight + timingWeight || 1;
      setFitWeight(newVal);
      setVolumeWeight(Math.round((volumeWeight / total) * remaining));
      setTimingWeight(100 - newVal - Math.round((volumeWeight / total) * remaining));
    } else if (field === 'volume') {
      const total = fitWeight + timingWeight || 1;
      setVolumeWeight(newVal);
      setFitWeight(Math.round((fitWeight / total) * remaining));
      setTimingWeight(100 - newVal - Math.round((fitWeight / total) * remaining));
    } else {
      const total = fitWeight + volumeWeight || 1;
      setTimingWeight(newVal);
      setFitWeight(Math.round((fitWeight / total) * remaining));
      setVolumeWeight(100 - newVal - Math.round((fitWeight / total) * remaining));
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icp_config: {
            industries: selectedIndustries,
            systems: selectedSystems,
            geographies: selectedGeographies,
            bundeslaender: selectedBundeslaender,
            min_volume: minVolume,
            max_volume: maxVolume,
            target_carriers: targetCarriers,
            excluded_carriers: excludedCarriers,
            min_score: minScore,
          },
          scoring_weights: {
            fit: fitWeight,
            volume: volumeWeight,
            timing: timingWeight,
          },
          notifications_config: {
            slack_webhook: slackWebhook,
            notify_email: notifyEmail,
            notify_hot: notifyHot,
            notify_new_layer: notifyNewLayer,
            notify_weekly: notifyWeekly,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body.error ?? `Fehler ${res.status}`);
        return;
      }
      setSavedAt(new Date());
      setSaveError(null);
      refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  }, [
    refresh,
    selectedIndustries,
    selectedSystems,
    selectedGeographies,
    selectedBundeslaender,
    minVolume,
    maxVolume,
    targetCarriers,
    excludedCarriers,
    minScore,
    fitWeight,
    volumeWeight,
    timingWeight,
    slackWebhook,
    notifyEmail,
    notifyHot,
    notifyNewLayer,
    notifyWeekly,
  ]);

  function toggleItem(list: string[], setList: (l: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  function ChipGroup({
    items,
    selected,
    onToggle,
    color = c.accent,
    bg,
  }: {
    items: string[];
    selected: string[];
    onToggle: (item: string) => void;
    color?: string;
    bg?: string;
  }) {
    const activeBg = bg ?? (isDark ? `${color}22` : '#EEF0FF');
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              style={{
                padding: '5px 12px',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: active ? activeBg : c.bgPage,
                color: active ? color : c.textSub,
                outline: active ? `1.5px solid ${color}40` : 'none',
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: '100%',
          background: c.bgPage,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, color: c.textMuted, fontSize: 13, fontWeight: 600 }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ animation: 'spin 0.8s linear infinite' }}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Einstellungen werden geladen…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: c.bgPage,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Hero header */}
      <div
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${c.bgCard} 0%, ${c.bg} 100%)`
            : 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
          borderBottom: `1px solid ${c.border}`,
          padding: '24px 32px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: c.bgCard,
              border: `1px solid ${isDark ? c.border : '#E0E3FF'}`,
              color: c.accent,
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 10,
              letterSpacing: '0.04em',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent }} />
            Konfiguration
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 5px', color: c.text, lineHeight: 1 }}>
            Einstellungen
          </h1>
          <p style={{ fontSize: 13, color: c.textSub, margin: 0 }}>
            ICP, Scoring-Gewichte, Benachrichtigungen & Export
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {saveError && !saving && (
            <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>Fehler: {saveError}</span>
          )}
          {savedAt && !saving && !saveError && (
            <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
              Gespeichert {savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? (isDark ? `${c.accent}88` : '#A5B4FC') : c.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'background 0.15s',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            {saving ? (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Wird gespeichert…
              </>
            ) : (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="13.5 4.5 6 12 2.5 8.5" />
                </svg>
                Speichern
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>
        {/* ICP */}
        <Section
          title="ICP-Konfiguration"
          sub="Ideal Customer Profile — definiert welche Leads als Treffer gewertet werden"
          c={c}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Geographie */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Geographie
              </div>
              <ChipGroup
                items={GEOGRAPHIES}
                selected={selectedGeographies}
                onToggle={(i) => toggleItem(selectedGeographies, setSelectedGeographies, i)}
                color="#0891B2"
                bg={isDark ? 'rgba(8,145,178,0.2)' : '#ECFEFF'}
              />
            </div>
            <div style={{ paddingLeft: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 8 }}>
                Bundesländer (optional — leer = ganz DACH)
              </div>
              <ChipGroup
                items={BUNDESLAENDER}
                selected={selectedBundeslaender}
                onToggle={(i) => toggleItem(selectedBundeslaender, setSelectedBundeslaender, i)}
                color="#0891B2"
                bg={isDark ? 'rgba(8,145,178,0.2)' : '#ECFEFF'}
              />
            </div>

            {/* Paketvolumen */}
            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 16,
                }}
              >
                Paketvolumen (Pakete / Tag)
              </div>
              <Slider
                label="Mindestvolumen"
                min={50}
                max={5000}
                value={minVolume}
                onChange={setMinVolume}
                unit=" Pakete/Tag"
                c={c}
              />
              <Slider
                label="Maximalvolumen (0 = unbegrenzt)"
                min={500}
                max={10000}
                value={maxVolume}
                onChange={setMaxVolume}
                unit=" Pakete/Tag"
                c={c}
              />
              <div style={{ fontSize: 11, color: c.textSub, marginTop: -8 }}>
                Zu kleine Shops rentieren sich nicht — zu große sind in Langzeitverträgen gebunden
              </div>
            </div>

            {/* Branchen */}
            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Branchen
              </div>
              <ChipGroup
                items={INDUSTRIES}
                selected={selectedIndustries}
                onToggle={(i) => toggleItem(selectedIndustries, setSelectedIndustries, i)}
              />
            </div>

            {/* Shop-Systeme */}
            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Shop-Systeme (Technographics)
              </div>
              <ChipGroup
                items={SYSTEMS}
                selected={selectedSystems}
                onToggle={(i) => toggleItem(selectedSystems, setSelectedSystems, i)}
                color="#7C3AED"
                bg={isDark ? 'rgba(124,58,237,0.2)' : '#F5F3FF'}
              />
            </div>

            {/* Ziel-Carrier */}
            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Ziel-Carrier (aktuell genutzt — zu gewinnen)
              </div>
              <ChipGroup
                items={CARRIERS}
                selected={targetCarriers}
                onToggle={(i) => toggleItem(targetCarriers, setTargetCarriers, i)}
                color="#059669"
                bg={isDark ? 'rgba(5,150,105,0.2)' : '#ECFDF5'}
              />
              <div style={{ fontSize: 11, color: c.textSub, marginTop: 8 }}>
                Leads die aktuell bei diesen Carriern sind, sind potenzielle Wechselkandidaten
              </div>
            </div>

            {/* Ausschliessen */}
            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Ausschliessen (Smart Parcel bereits Carrier)
              </div>
              <ChipGroup
                items={CARRIERS}
                selected={excludedCarriers}
                onToggle={(i) => toggleItem(excludedCarriers, setExcludedCarriers, i)}
                color="#DC2626"
                bg={isDark ? 'rgba(220,38,38,0.2)' : '#FEF2F2'}
              />
              <div style={{ fontSize: 11, color: c.textSub, marginTop: 8 }}>
                Leads bei denen Smart Parcel bereits aktiv ist, werden aus der Pipeline entfernt
              </div>
            </div>

            {/* Hot-Lead Schwellwert */}
            <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 16,
                }}
              >
                Mindest-Score fur Hot-Lead
              </div>
              <Slider label="Hot-Lead Schwellwert" min={50} max={95} value={minScore} onChange={setMinScore} c={c} />
            </div>
          </div>
        </Section>

        {/* Scoring Weights */}
        <Section title="Scoring-Gewichtung" sub="Wie stark fließt jede Dimension in den Gesamtscore ein" c={c}>
          <Slider
            label="Fit Score (ICP-Übereinstimmung)"
            min={10}
            max={80}
            value={fitWeight}
            onChange={(v) => setWeightBalanced('fit', v)}
            unit="%"
            c={c}
          />
          <Slider
            label="Volumen Score (Paketvolumen-Potenzial)"
            min={10}
            max={80}
            value={volumeWeight}
            onChange={(v) => setWeightBalanced('volume', v)}
            unit="%"
            c={c}
          />
          <Slider
            label="Timing Score (Wechselbereitschaft)"
            min={10}
            max={80}
            value={timingWeight}
            onChange={(v) => setWeightBalanced('timing', v)}
            unit="%"
            c={c}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {[
              { label: 'Fit', value: fitWeight, color: c.accent },
              { label: 'Volumen', value: volumeWeight, color: '#0891B2' },
              { label: 'Timing', value: timingWeight, color: '#DB2777' },
            ].map((d) => (
              <div
                key={d.label}
                style={{ flex: d.value, height: 6, background: d.color, borderRadius: 99, transition: 'flex 0.3s' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {[
              { label: 'Fit', value: fitWeight, color: c.accent },
              { label: 'Volumen', value: volumeWeight, color: '#0891B2' },
              { label: 'Timing', value: timingWeight, color: '#DB2777' },
            ].map((d) => (
              <span key={d.label} style={{ fontSize: 11, fontWeight: 700, color: d.color }}>
                {d.label} {d.value}%
              </span>
            ))}
          </div>
          {totalWeight !== 100 && (
            <div style={{ fontSize: 11, color: '#D97706', marginTop: 8 }}>Summe: {totalWeight}% (sollte 100% sein)</div>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Benachrichtigungen" sub="Wann und wie du über neue Signale informiert wirst" c={c}>
          <Toggle
            label="Hot Lead Alert"
            sub="Benachrichtigung wenn ein Lead den Schwellwert überschreitet"
            value={notifyHot}
            onChange={setNotifyHot}
            c={c}
          />
          <Toggle
            label="Neuer Layer angereichert"
            sub="Wenn ein Lead neue Firmendaten oder Kaufsignale erhält"
            value={notifyNewLayer}
            onChange={setNotifyNewLayer}
            c={c}
          />
          <Toggle
            label="Wochentlicher Report"
            sub="Montags: Pipeline-Zusammenfassung per E-Mail"
            value={notifyWeekly}
            onChange={setNotifyWeekly}
            c={c}
          />

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: c.textSub, display: 'block', marginBottom: 6 }}>
                E-Mail
              </label>
              <input
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1.5px solid ${c.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: c.bgPage,
                  color: c.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: c.textSub, display: 'block', marginBottom: 6 }}>
                Slack Webhook URL
              </label>
              <input
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1.5px solid ${c.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: c.bgPage,
                  color: c.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </Section>

        {/* Export */}
        <Section title="Export & Automatisierung" sub="CRM-Übergabe und automatische Reports" c={c}>
          <Toggle
            label="Automatischer CSV-Export"
            sub="Täglich um 08:00 — Hot Leads der letzten 24h"
            value={autoExport}
            onChange={setAutoExport}
            c={c}
          />
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: c.textSub, display: 'block', marginBottom: 8 }}>
              Export-Format
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['csv', 'xlsx'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  style={{
                    padding: '7px 20px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: exportFormat === fmt ? c.text : c.bgPage,
                    color: exportFormat === fmt ? c.bgCard : c.textSub,
                  }}
                >
                  .{fmt}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Gefahrenzone" sub="Unwiderrufliche Aktionen" c={c}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Alle Leads zurucksetzen</div>
              <div style={{ fontSize: 12, color: c.textSub, marginTop: 2 }}>
                Entfernt alle Leads und Anreicherungen aus dieser Ansicht
              </div>
            </div>
            <button
              onClick={() => {
                if (!window.confirm('Alle Einstellungen auf Standardwerte zurücksetzen?')) return;
                setSelectedIndustries([
                  'Mode & Bekleidung',
                  'Sport & Outdoor',
                  'Elektronik & Technik',
                  'Haushalt & Living',
                ]);
                setSelectedSystems(['Shopify', 'Shopware 6', 'WooCommerce', 'JTL']);
                setSelectedGeographies(['Deutschland', 'Österreich', 'Schweiz']);
                setSelectedBundeslaender([]);
                setMinVolume(100);
                setMaxVolume(3000);
                setTargetCarriers(['DHL', 'DPD', 'Hermes / evri', 'GLS']);
                setExcludedCarriers([]);
                setMinScore(65);
                setFitWeight(40);
                setVolumeWeight(35);
                setTimingWeight(25);
                setSlackWebhook('');
                setNotifyEmail('');
                setNotifyHot(true);
                setNotifyNewLayer(false);
                setNotifyWeekly(true);
                setAutoExport(false);
                setExportFormat('csv');
              }}
              style={{
                padding: '8px 16px',
                background: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2',
                color: '#DC2626',
                border: isDark ? '1px solid rgba(220,38,38,0.3)' : '1px solid #FECACA',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Zurücksetzen
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
