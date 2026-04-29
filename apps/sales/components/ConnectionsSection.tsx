import NetworkCanvas from './NetworkCanvas';
import { OnveroGradient } from './OnveroGradient';

export function ConnectionsSection() {
  return (
    <section className="bg-white font-[family-name:var(--font-nunito)] text-[#0A2540]">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 md:pb-32 md:px-8">
        <div className="mb-10 max-w-4xl md:mb-14">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[#4F46E5]">
            Verbundenes Netzwerk
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.2] tracking-[-0.01em] md:text-4xl lg:text-[40px] lg:leading-[1.2]">
            <span className="text-[#0A2540]">
              Jeder Agent kennt jedes Tool.
            </span>{' '}
            <span className="text-[#808080]">
              Daten fließen organisch zwischen Modellen, APIs und Datenbanken
              — getragen vom Business Agent, gesichert in Ihrer Infrastruktur.
            </span>
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-[15px] shadow-2xl shadow-[#0D0D2B]/30 ring-1 ring-black/5">
          <OnveroGradient
            className="absolute inset-0"
            colors={['#0D0D2B', '#2D1B69', '#0EA5E9', '#6EE7B7']}
            style={{ width: '100%', height: '100%', borderRadius: 0 }}
          />

          <div className="relative aspect-[1115/560] w-full">
            <NetworkCanvas className="absolute inset-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
