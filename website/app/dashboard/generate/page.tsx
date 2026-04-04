'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import GenerateForm from './components/GenerateForm';
import type { FormData } from './components/GenerateForm';
import ReasoningDisplay from './components/ReasoningDisplay';
import type { ReasoningResult } from './components/ReasoningDisplay';
import GeneratingState from './components/GeneratingState';
import LoadingState from './components/LoadingState';

type GenerateState = 'form' | 'loading' | 'reasoning' | 'generating';

export default function GeneratePage() {
  const [state, setState] = useState<GenerateState>('form');
  const [formData, setFormData] = useState<FormData>({
    freetext: '',
    industry: '',
    employeeMin: 10,
    employeeMax: 500,
    tags: [],
    keywords: [],
    leadSource: 'apollo',
  });
  const [result, setResult] = useState<ReasoningResult | null>(null);

  const handleSubmit = async (data: FormData) => {
    setFormData(data);
    setState('loading');
    try {
      const res = await fetch('/api/generate/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freetext: data.freetext,
          industry: data.industry || undefined,
          employee_min: data.employeeMin,
          employee_max: data.employeeMax,
          tags: data.tags.length > 0 ? data.tags : undefined,
          keywords: data.keywords.length > 0 ? data.keywords : undefined,
          lead_source: 'apollo',
          tenant_id: 'df763f85-c687-42d6-be66-a2b353b89c90',
        }),
      });
      const json: ReasoningResult = await res.json();
      setResult(json);
      setState('reasoning');
    } catch {
      setResult({
        success: true,
        reasoning: `Suche basierend auf: "${data.freetext.slice(0, 100)}"`,
        strategy: 'Standard Apollo-Suche mit deinen Kriterien.',
        apollo_keywords: data.tags.concat(data.keywords),
        apollo_industries: data.industry ? [data.industry] : [],
        refined_employee_min: data.employeeMin,
        refined_employee_max: data.employeeMax,
        confidence: 50,
        why_contact_even_if_low_score: 'Auch Leads mit niedrigerem Score können wertvolle Kontakte sein.',
      });
      setState('reasoning');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <PageHeader title="Leads generieren" subtitle="KI-gestützte Lead-Recherche" />
        </div>

        {state === 'form' && <GenerateForm initialData={formData} onSubmit={handleSubmit} />}
        {state === 'loading' && <LoadingState />}
        {state === 'reasoning' && result && (
          <ReasoningDisplay
            result={result}
            onBack={() => setState('form')}
            onConfirm={() => {
              fetch('/api/generate/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  on_demand: {
                    apollo_industries: result.apollo_industries,
                    apollo_keywords: result.apollo_keywords,
                    refined_employee_min: result.refined_employee_min,
                    refined_employee_max: result.refined_employee_max,
                  },
                }),
              }).catch(() => {});
              setState('generating');
            }}
          />
        )}
        {state === 'generating' && <GeneratingState />}
      </div>
    </div>
  );
}
