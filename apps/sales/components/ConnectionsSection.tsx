import NetworkCanvas from './NetworkCanvas';

export function ConnectionsSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="aspect-[16/9] w-full">
        <NetworkCanvas className="h-full w-full" />
      </div>
    </section>
  );
}
