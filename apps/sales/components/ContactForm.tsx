"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MultiStepForm } from "@/components/ui/multi-step-form";
import { AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  employees: string;
  currentTools: string;
  digitalMaturity: number;
  services: string[];
  mainProblem: string;
  goal: string;
  budget: string;
  desiredStart: string;
  preferredDate: string;
  preferredTime: string;
  source: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

const INITIAL: FormData = {
  name: "", company: "", email: "", phone: "", website: "",
  industry: "", employees: "", currentTools: "", digitalMaturity: 0,
  services: [], mainProblem: "", goal: "", budget: "", desiredStart: "",
  preferredDate: "", preferredTime: "", source: "",
};

const WEBHOOK = "/api/contact";

const EMPLOYEE_OPTIONS = ["1–10", "11–50", "51–200", "200+"] as const;
const SERVICE_OPTIONS  = ["KI-Website", "Workflow-Automatisierung", "Micro AI App", "BusinessOS", "Alles zusammen"] as const;
const BUDGET_OPTIONS   = ["< 1.000 €", "1.000–3.000 €", "3.000–7.500 €", "7.500–15.000 €", "> 15.000 €"] as const;
const TIME_OPTIONS     = ["08:00–09:00", "09:00–10:00", "10:00–11:00", "11:00–12:00", "13:00–14:00", "14:00–15:00", "15:00–16:00", "16:00–17:00"] as const;
const MATURITY_LABELS  = ["", "Kaum digital", "Grundlagen vorhanden", "Fortgeschritten", "Gut aufgestellt", "Voll digitalisiert"] as const;

const STEPS = [
  { title: "Kontakt",        description: "Damit wir wissen, mit wem wir sprechen." },
  { title: "Unternehmen",    description: "Hilf uns, euren Kontext zu verstehen." },
  { title: "Projekt & Ziel", description: "Was soll entstehen — und warum?" },
  { title: "Wunschtermin",   description: "Wann passt dir ein erstes Gespräch?" },
] as const;

// ── Shared input style ─────────────────────────────────────────────────────────
const inputCls = [
  "w-full bg-transparent border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white",
  "placeholder:text-white/25 outline-none transition-all duration-200",
  "focus:border-white/30 focus:bg-white/[0.02]",
].join(" ");

// ── Field wrapper ──────────────────────────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
        {label}{required && <span className="ml-1" style={{ color: "rgba(255,255,255,0.2)" }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: "rgba(255,100,100,0.85)" }}>{error}</p>}
    </div>
  );
}

// ── Single pill select ─────────────────────────────────────────────────────────
function PillSelect({ options, value, onChange }: {
  options: readonly string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt} type="button"
            onClick={() => onChange(active ? "" : opt)}
            className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
              color:      active ? "#000000" : "rgba(255,255,255,0.5)",
              border:     active ? "none"    : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Multi-select pills ─────────────────────────────────────────────────────────
function MultiPills({ options, value, onChange }: {
  options: readonly string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = value.includes(opt);
        return (
          <button
            key={opt} type="button" onClick={() => toggle(opt)}
            className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
              color:      active ? "#000000" : "rgba(255,255,255,0.5)",
              border:     active ? "none"    : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Maturity picker ────────────────────────────────────────────────────────────
function MaturityPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n} type="button" onClick={() => onChange(n)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: n === value ? "#ffffff" : "rgba(255,255,255,0.04)",
              color:      n === value ? "#000000" : "rgba(255,255,255,0.35)",
              border:     n === value ? "none"    : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {value > 0 && (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {MATURITY_LABELS[value]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ContactForm() {
  const [step, setStep]           = useState(1);           // 1-based for MultiStepForm
  const [direction, setDirection] = useState(1);
  const [data, setData]           = useState<FormData>(INITIAL);
  const [errors, setErrors]       = useState<Errors>({});
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  const totalSteps = STEPS.length;

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  function validate(): boolean {
    const e: Errors = {};
    if (step === 1) {
      if (!data.name.trim())    e.name    = "Bitte deinen Namen angeben";
      if (!data.company.trim()) e.company = "Bitte dein Unternehmen angeben";
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        e.email = "Gültige E-Mail-Adresse erforderlich";
    }
    if (step === 2) {
      if (!data.industry.trim()) e.industry       = "Bitte Branche angeben";
      if (!data.employees)       e.employees      = "Bitte Mitarbeiteranzahl wählen";
      if (!data.digitalMaturity) e.digitalMaturity = "Bitte Digitalisierungsgrad wählen";
    }
    if (step === 3) {
      if (!data.services.length)    e.services    = "Bitte mindestens eine Leistung wählen";
      if (!data.mainProblem.trim()) e.mainProblem = "Bitte das größte Problem beschreiben";
    }
    if (step === 4) {
      if (!data.preferredDate) e.preferredDate = "Bitte ein Datum wählen";
      if (!data.preferredTime) e.preferredTime = "Bitte eine Uhrzeit wählen";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    if (step === totalSteps) { handleSubmit(); return; }
    setDirection(1);
    setStep(s => s + 1);
  }

  function handleBack() {
    setDirection(-1);
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setSubmitErr("");
    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            data.name,
          company:         data.company,
          email:           data.email,
          phone:           data.phone    || null,
          website:         data.website  || null,
          industry:        data.industry,
          employees:       data.employees,
          currentTools:    data.currentTools || null,
          digitalMaturity: data.digitalMaturity,
          services:        data.services,
          mainProblem:     data.mainProblem,
          goal:            data.goal        || null,
          budget:          data.budget      || null,
          desiredStart:    data.desiredStart || null,
          preferredDate:   data.preferredDate,
          preferredTime:   data.preferredTime,
          source:          data.source      || null,
          submittedAt:     new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
    } catch {
      setSubmitErr("Etwas ist schiefgelaufen. Bitte versuche es erneut oder schreib uns direkt an info@onvero.de");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const currentStepMeta = STEPS[step - 1];

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[640px] mx-auto flex flex-col items-center justify-center text-center py-24 gap-8"
        style={{
          backgroundColor: "#111111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Pulsing ring */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute rounded-full"
            style={{ width: 72, height: 72, border: "1px solid rgba(255,255,255,0.12)" }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 72, height: 72, border: "1px solid rgba(255,255,255,0.08)" }}
            animate={{ scale: [1, 1.9, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          {/* Spinner */}
          <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
            <motion.circle
              cx="20" cy="20" r="16"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="25 75"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "20px 20px" }}
            />
          </svg>
        </div>

        {/* Dots + text */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-white">Briefing wird übermittelt</p>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[640px] mx-auto flex flex-col items-center justify-center text-center py-20 gap-6"
        style={{
          backgroundColor: "#111111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ border: "1.5px solid rgba(255,255,255,0.25)" }}
        >
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
            <motion.path
              d="M2 9L8.5 16L22 2"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="28" strokeDashoffset={28}
              animate={{ strokeDashoffset: 0 }}
              transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-3">Briefing eingegangen!</h2>
          <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.42)" }}>
            Wir melden uns innerhalb von 24 Stunden an{" "}
            <span className="font-medium" style={{ color: "rgba(255,255,255,0.72)" }}>{data.email}</span>.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <MultiStepForm
      className="mx-auto"
      currentStep={step}
      totalSteps={totalSteps}
      title={currentStepMeta.title}
      description={currentStepMeta.description}
      direction={direction}
      onBack={handleBack}
      onNext={handleNext}
      backButtonText="← Zurück"
      nextButtonText={step === totalSteps ? "Jetzt absenden →" : "Weiter →"}
      footerContent={
        submitErr
          ? <span style={{ color: "rgba(255,100,100,0.85)", fontSize: 12 }}>{submitErr}</span>
          : <span>Schritt {step} von {totalSteps}</span>
      }
    >
      {/* ── STEP 1: Kontakt ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" required error={errors.name}>
              <input className={inputCls} placeholder="Max Mustermann"
                value={data.name} onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Unternehmen" required error={errors.company}>
              <input className={inputCls} placeholder="Muster GmbH"
                value={data.company} onChange={e => set("company", e.target.value)} />
            </Field>
          </div>
          <Field label="E-Mail" required error={errors.email}>
            <input className={inputCls} type="email" placeholder="max@muster.de"
              value={data.email} onChange={e => set("email", e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefon">
              <input className={inputCls} type="tel" placeholder="+49 …"
                value={data.phone} onChange={e => set("phone", e.target.value)} />
            </Field>
            <Field label="Website">
              <input className={inputCls} placeholder="www.muster.de"
                value={data.website} onChange={e => set("website", e.target.value)} />
            </Field>
          </div>
        </div>
      )}

      {/* ── STEP 2: Unternehmen ── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Field label="Branche" required error={errors.industry}>
            <input className={inputCls} placeholder="z. B. E-Commerce, Handwerk, Beratung…"
              value={data.industry} onChange={e => set("industry", e.target.value)} />
          </Field>
          <Field label="Mitarbeiteranzahl" required error={errors.employees}>
            <PillSelect options={EMPLOYEE_OPTIONS} value={data.employees}
              onChange={v => set("employees", v)} />
          </Field>
          <Field label="Aktuelle Tools / Software">
            <textarea className={inputCls + " resize-none"} rows={3}
              placeholder="z. B. HubSpot, Lexoffice, Excel, Slack…"
              value={data.currentTools} onChange={e => set("currentTools", e.target.value)} />
          </Field>
          <Field label="Digitalisierungsgrad (1 = kaum, 5 = vollständig)" required error={errors.digitalMaturity}>
            <MaturityPicker value={data.digitalMaturity}
              onChange={v => set("digitalMaturity", v)} />
          </Field>
        </div>
      )}

      {/* ── STEP 3: Projekt & Ziel ── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Field label="Gewünschte Leistung" required error={errors.services}>
            <MultiPills options={SERVICE_OPTIONS} value={data.services}
              onChange={v => set("services", v)} />
          </Field>
          <Field label="Größtes Problem / Zeitfresser" required error={errors.mainProblem}>
            <textarea className={inputCls + " resize-none"} rows={3}
              placeholder="Was kostet euch aktuell am meisten Zeit oder Nerven?"
              value={data.mainProblem} onChange={e => set("mainProblem", e.target.value)} />
          </Field>
          <Field label="Ziel in 3 Monaten">
            <textarea className={inputCls + " resize-none"} rows={2}
              placeholder="Was soll bis dahin messbar besser sein?"
              value={data.goal} onChange={e => set("goal", e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Budgetrahmen">
              <PillSelect options={BUDGET_OPTIONS} value={data.budget}
                onChange={v => set("budget", v)} />
            </Field>
            <Field label="Wunsch-Starttermin">
              <input className={inputCls} type="date" min={today}
                value={data.desiredStart} onChange={e => set("desiredStart", e.target.value)}
                style={{ colorScheme: "dark" }} />
            </Field>
          </div>
        </div>
      )}

      {/* ── STEP 4: Termin ── */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <Field label="Wunschdatum" required error={errors.preferredDate}>
            <input className={inputCls} type="date" min={today}
              value={data.preferredDate} onChange={e => set("preferredDate", e.target.value)}
              style={{ colorScheme: "dark" }} />
          </Field>
          <Field label="Wunschuhrzeit" required error={errors.preferredTime}>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map(time => (
                <button
                  key={time} type="button"
                  onClick={() => set("preferredTime", time)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: data.preferredTime === time ? "#ffffff" : "rgba(255,255,255,0.04)",
                    color:      data.preferredTime === time ? "#000000" : "rgba(255,255,255,0.5)",
                    border:     data.preferredTime === time ? "none"    : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Wie hast du uns gefunden?">
            <input className={inputCls} placeholder="Google, Empfehlung, LinkedIn, Instagram…"
              value={data.source} onChange={e => set("source", e.target.value)} />
          </Field>
        </div>
      )}
    </MultiStepForm>
  );
}
