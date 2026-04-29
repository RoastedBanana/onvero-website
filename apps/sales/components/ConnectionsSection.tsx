import NetworkCanvas from './NetworkCanvas';

const stats = [
  { value: '500+', label: 'Stunden Recherche\npro Monat eingespart' },
  { value: '3×', label: 'höhere Conversion-Rate\nvs. manuelles Outbound' },
  { value: '99,9 %', label: 'verfügbar — DSGVO-konform\nin Frankfurt gehostet' },
  { value: '100+', label: 'integrierte Tools, APIs\nund Datenquellen' },
];

export function ConnectionsSection() {
  return (
    <section
      className="font-[family-name:var(--font-nunito)] text-white"
      style={{
        background:
          'radial-gradient(ellipse 80% 65% at 50% 95%, #00D4A8 0%, #1A3A6B 55%, #0F2A4F 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28">
        <h2 className="mx-auto max-w-3xl text-balance text-center text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-5xl lg:text-[64px]">
          Wir strukturieren
          <br className="hidden md:block" /> deine Daten
        </h2>

        <div className="my-12 border-y border-white/15 md:my-16">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`px-4 py-8 md:px-6 md:py-10 ${
                  i < stats.length - 1
                    ? 'md:border-r md:border-white/10'
                    : ''
                } ${i % 2 === 0 ? 'border-r border-white/10 md:border-r' : ''} ${
                  i < 2 ? 'border-b border-white/10 md:border-b-0' : ''
                }`}
              >
                <p className="text-3xl font-medium tracking-tight md:text-4xl lg:text-[40px]">
                  {stat.value}
                </p>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.5] text-white/70 md:text-[15px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto aspect-[16/9] w-full max-w-5xl">
          <NetworkCanvas className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
