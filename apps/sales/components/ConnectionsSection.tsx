import NetworkCanvas from './NetworkCanvas';

export function ConnectionsSection() {
  return (
    <section className="bg-[#1A3A6B] font-[family-name:var(--font-nunito)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28">
        <div className="mb-10 max-w-3xl md:mb-14">
          <h2 className="text-balance text-3xl font-bold leading-[1.2] tracking-[-0.01em] md:text-4xl lg:text-[40px] lg:leading-[1.2]">
            Wir strukturieren deine Daten
          </h2>
        </div>
        <div className="mx-auto aspect-[16/9] w-full max-w-5xl">
          <NetworkCanvas className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
