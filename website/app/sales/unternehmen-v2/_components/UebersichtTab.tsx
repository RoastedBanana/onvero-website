'use client';

import type { Company, CompanyStatus } from '../_types';
import { sanitizeArrayForDisplay } from '../_lib/language-guard';
import NextActionBanner from './NextActionBanner';
import SummaryCard from './SummaryCard';
import ScoreBreakdownCard from './ScoreBreakdownCard';
import InsightsTripleCard from './InsightsTripleCard';

export default function UebersichtTab({
  company,
  onOutreachClick,
  onStatusChange,
}: {
  company: Company;
  onOutreachClick: () => void;
  onStatusChange?: (s: CompanyStatus) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NextActionBanner nextAction={company.next_action} onDraftClick={onOutreachClick} />

      {/* 2-col: Summary | Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12 }}>
        <SummaryCard
          summary={company.summary}
          apolloDescription={company.apollo_short_description}
          strengths={company.strengths}
          concerns={company.concerns}
        />
        <ScoreBreakdownCard company={company} onStatusChange={onStatusChange} />
      </div>

      {/* 3-col insights */}
      <InsightsTripleCard
        automationOpportunities={sanitizeArrayForDisplay(company.automation_opportunities)}
        growthSignals={sanitizeArrayForDisplay(company.growth_signals)}
        techStack={sanitizeArrayForDisplay(company.tech_stack)}
        personalizationHooks={sanitizeArrayForDisplay(company.personalization_hooks)}
      />

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 3fr 2fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 720px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
