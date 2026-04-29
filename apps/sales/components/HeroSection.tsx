import { LogoBar } from './LogoBar';
import { Navbar } from './Navbar';
import { OnveroGradient } from './OnveroGradient';

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-white font-[family-name:var(--font-nunito)]">
      <Navbar />

      <div
        className="
          pointer-events-none absolute z-0
          top-[-10%] right-[-20%] w-[120%] h-[60%]
          rotate-[-8deg] opacity-30
          md:top-[-20%] md:right-[-15%] md:w-[50%] md:h-[140%]
          md:rotate-[-12deg] md:opacity-100
          lg:right-[-10%] lg:w-[60%]
        "
      >
        <OnveroGradient
          colors={['#0D0D2B', '#2D1B69', '#0EA5E9', '#6EE7B7']}
          style={{ width: '100%', height: '100%', borderRadius: '40px' }}
        />
      </div>

      <div
        className="
          relative z-10 mx-auto flex w-full max-w-[1280px] flex-col
          px-6 md:px-10 lg:px-16
          pt-[120px] md:pt-[160px] lg:pt-[180px]
          pb-[160px]
        "
      >
        <div className="max-w-[640px]">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#4F46E5]">
            KI-Infrastruktur für den Mittelstand
          </p>

          <h1 className="text-[36px] md:text-[48px] lg:text-[56px] leading-[1.15] tracking-[-0.02em] font-bold text-[#0A2540]">
            Dein Business. Automatisiert.
          </h1>

          <p className="mt-6 max-w-[560px] text-[18px] md:text-[20px] leading-[1.4] font-medium text-[#425466]">
            Mit BusinessOS steuerst du Lead-Generierung, Kundenkommunikation und
            Prozesse zentral — powered by KI.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              className="inline-flex items-center px-7 py-3.5 text-[16px] font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg transition-colors shadow-sm"
            >
              Demo anfragen
            </a>
            <a
              href="#mehr"
              className="inline-flex items-center px-7 py-3.5 text-[16px] font-semibold text-[#0A2540] bg-white border border-[#C1C9D2] hover:border-[#0A2540] rounded-lg transition-colors"
            >
              Mehr erfahren
            </a>
          </div>
        </div>
      </div>

      <LogoBar />
    </section>
  );
}
