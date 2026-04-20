'use client';

import type { Company } from '../_types';
import NextActionBanner from './NextActionBanner';
import SummaryCard from './SummaryCard';
import ScoreBreakdownCard from './ScoreBreakdownCard';
import InsightsTripleCard from './InsightsTripleCard';

export default function UebersichtTab({ company, onOutreachClick }: { company: Company; onOutreachClick: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NextActionBanner nextAction={company.next_action} onDraftClick={onOutreachClick} />

      {/* 2-col: Summary | Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <SummaryCard
          summary={company.summary}
          apolloDescription={company.apollo_short_description}
          strengths={company.strengths}
          concerns={company.concerns}
        />
        <ScoreBreakdownCard company={company} />
      </div>

      {/* 3-col insights */}
      <InsightsTripleCard
        automationOpportunities={company.automation_opportunities}
        growthSignals={company.growth_signals}
        techStack={company.tech_stack}
        personalizationHooks={company.personalization_hooks}
      />

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 2fr 1fr"] {
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
