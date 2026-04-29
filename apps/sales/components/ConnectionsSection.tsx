import NetworkCanvas from './NetworkCanvas';

const stats = [
  { value: '500+', label: 'Stunden Recherche\npro Monat eingespart' },
  { value: '3×', label: 'höhere Conversion-Rate\nvs. manuelles Outbound' },
  { value: '99,9 %', label: 'verfügbar — DSGVO-konform\nin Frankfurt gehostet' },
  { value: '100+', label: 'integrierte Tools, APIs\nund Datenquellen' },
];

export function ConnectionsSection() {
  return (
    <section className="relative bg-white py-20 font-[family-name:var(--font-nunito)] md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <h2 className="mx-auto max-w-3xl text-balance text-center text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[#0A2540] md:text-5xl lg:text-[64px]">
          Wir strukturieren
          <br className="hidden md:block" /> deine Daten
        </h2>
      </div>

      {/* Wrapper around stats and artwork — hosts a single full-width
          radial glow that terminates with a clean bottom edge but reaches
          high enough to brush against the stat numbers above. */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 90% at 50% 100%, rgba(0,212,168,0.82) 0%, rgba(40,80,210,0.62) 28%, rgba(20,40,150,0.46) 50%, rgba(10,28,110,0.28) 72%, rgba(255,255,255,0) 95%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 md:px-8">
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

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="relative aspect-[16/9]">
            <NetworkCanvas className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
