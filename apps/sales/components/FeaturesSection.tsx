type FeatureSize = 'large' | 'medium';

const features: { id: number; title: string; size: FeatureSize }[] = [
  { id: 1, title: 'Generieren Sie Leads automatisch mit KI', size: 'large' },
  { id: 2, title: 'Personalisieren Sie Kundenkommunikation auf neuem Level', size: 'large' },
  { id: 3, title: 'Verbinden Sie alle Ihre Tools nahtlos', size: 'medium' },
  { id: 4, title: 'Verwalten Sie Daten zentral und DSGVO-konform', size: 'medium' },
  { id: 5, title: 'Skalieren Sie ohne mehr Personal einzustellen', size: 'medium' },
  { id: 6, title: 'Wir bauen, betreuen und entwickeln gemeinsam weiter', size: 'large' },
];

function FeatureCard({ title, size }: { title: string; size: FeatureSize }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#C1C9D2]/40 bg-white p-8 shadow-[0_1px_2px_rgba(10,37,64,0.04),0_8px_24px_-12px_rgba(10,37,64,0.08)] transition-all duration-[1500ms] ease-[cubic-bezier(0.05,0.7,0.1,1)] hover:scale-[1.01] hover:border-transparent hover:shadow-[0_1px_2px_rgba(10,37,64,0.06),0_24px_56px_-16px_rgba(45,27,105,0.25)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#2D1B69]/12 via-[#0EA5E9]/10 to-[#6EE7B7]/15 opacity-0 transition-opacity duration-[1500ms] ease-[cubic-bezier(0.05,0.7,0.1,1)] group-hover:opacity-100"
      />

      <h3
        className={`max-w-md text-[22px] md:text-2xl font-bold leading-[1.25] tracking-[-0.01em] text-[#0A2540] ${
          size === 'large' ? 'mb-32 md:mb-40' : 'mb-20 md:mb-24'
        }`}
      >
        {title}
      </h3>

      <div
        aria-hidden="true"
        className={`rounded-xl bg-gradient-to-br from-[#0D0D2B]/[0.04] via-[#2D1B69]/[0.05] to-[#0EA5E9]/[0.06] ring-1 ring-inset ring-[#C1C9D2]/30 ${
          size === 'large' ? 'h-72 md:h-80' : 'h-44 md:h-48'
        }`}
      />
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="bg-white font-[family-name:var(--font-nunito)] text-[#0A2540]">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 md:px-8">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[#4F46E5]">
            Unsere Leistungen
          </p>
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-[1.15] tracking-[-0.02em] md:text-4xl lg:text-5xl">
            Alles, was Sie für Ihr Geschäft brauchen
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#425466] md:text-xl">
            Vom Lead bis zum Kunden — wir bauen das System, das zu Ihrem Unternehmen passt.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            {features.slice(0, 2).map((f) => (
              <FeatureCard key={f.id} title={f.title} size={f.size} />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.slice(2, 5).map((f) => (
              <FeatureCard key={f.id} title={f.title} size={f.size} />
            ))}
          </div>

          <div className="grid grid-cols-1">
            <FeatureCard title={features[5].title} size={features[5].size} />
          </div>
        </div>
      </div>
    </section>
  );
}
