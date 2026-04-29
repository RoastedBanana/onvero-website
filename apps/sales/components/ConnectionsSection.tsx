import NetworkCanvas from './NetworkCanvas';

const stats = [
  { value: '500+', label: 'Stunden Recherche\npro Monat eingespart' },
  { value: '3×', label: 'höhere Conversion-Rate\nvs. manuelles Outbound' },
  { value: '99,9 %', label: 'verfügbar — DSGVO-konform\nin Frankfurt gehostet' },
  { value: '100+', label: 'integrierte Tools, APIs\nund Datenquellen' },
];

export function ConnectionsSection() {
  return (
    <section className="bg-white py-20 font-[family-name:var(--font-nunito)] md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <h2 className="mx-auto max-w-3xl text-balance text-center text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[#0A2540] md:text-5xl lg:text-[64px]">
          Wir strukturieren
          <br className="hidden md:block" /> deine Daten
        </h2>

        <div className="my-12 border-y border-[#0A2540]/10 md:my-16">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`px-4 py-8 md:px-6 md:py-10 ${
                  i < stats.length - 1
                    ? 'md:border-r md:border-[#0A2540]/10'
                    : ''
                } ${
                  i % 2 === 0 ? 'border-r border-[#0A2540]/10 md:border-r' : ''
                } ${i < 2 ? 'border-b border-[#0A2540]/10 md:border-b-0' : ''}`}
              >
                <p className="text-3xl font-medium tracking-tight text-[#0A2540] md:text-4xl lg:text-[40px]">
                  {stat.value}
                </p>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.5] text-[#697386] md:text-[15px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="relative aspect-[16/9]">
            <NetworkCanvas className="h-full w-full" />
            {/* Mint→navy radial glow rendered above the canvas with
                screen blending — washes the strands themselves with
                colour rather than sitting behind them. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 75% 80% at 50% 60%, rgba(0,212,168,0.42) 0%, rgba(79,70,229,0.22) 40%, rgba(26,58,107,0.10) 65%, rgba(255,255,255,0) 85%)',
                mixBlendMode: 'screen',
                filter: 'blur(28px)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
