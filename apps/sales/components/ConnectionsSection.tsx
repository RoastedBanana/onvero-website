import NetworkCanvas from './NetworkCanvas';
import { OnveroGradient } from './OnveroGradient';

export function ConnectionsSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-8 md:pb-32 md:px-8">
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
