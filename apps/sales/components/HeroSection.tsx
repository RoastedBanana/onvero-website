import Link from 'next/link';
import { Button } from '@onvero/ui/primitives/button';
import { Navbar } from './Navbar';
import { OnveroGradient } from './OnveroGradient';

const trustedBy = ['n8n', 'Figma', 'Anthropic', 'OpenAI', 'Cursor', 'Supabase'];

export function HeroSection() {
  return (
    <main className="bg-white font-[family-name:var(--font-nunito)] text-[#0A2540]">
      <Navbar />
      <section className="overflow-hidden">
        <div className="pt-28 pb-20 md:pt-36 md:pb-32">
          <div className="relative z-10 mx-auto max-w-5xl px-6">
            <div className="relative text-center">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#4F46E5]">
                KI-Infrastruktur für den Mittelstand
              </p>

              <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-[-0.02em] leading-[1.1] md:text-5xl lg:text-[56px] lg:leading-[1.05]">
                Turning Fragmented Business Operations into an AI-Powered Orchestra
              </h1>

              <p className="mx-auto my-6 max-w-2xl text-balance text-lg font-medium leading-[1.45] text-[#425466] md:text-xl">
                We build AI-powered business systems tailored to your industry,
                your processes, and your customers — ready from day one.
              </p>

              <div className="flex flex-col items-center justify-center gap-3 *:w-full sm:flex-row sm:*:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#4F46E5] text-white shadow-sm hover:bg-[#4338CA]"
                >
                  <Link href="#demo">
                    <span className="text-nowrap">Demo anfragen</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[#C1C9D2] bg-white text-[#0A2540] hover:bg-[#F8F8FC] hover:text-[#0A2540]"
                >
                  <Link href="#mehr">
                    <span className="text-nowrap">Mehr erfahren</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto mt-12 aspect-[16/9] max-w-5xl overflow-hidden rounded-3xl shadow-2xl shadow-black/20 ring-1 ring-black/10 md:mt-20">
              <OnveroGradient
                style={{ width: '100%', height: '100%', borderRadius: 0 }}
              />
            </div>

            <div className="mt-12 md:mt-16">
              <p className="text-center text-sm text-[#697386]">Trusted by teams at:</p>
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[#697386]/60 md:gap-x-14">
                {trustedBy.map((p) => (
                  <li
                    key={p}
                    className="text-[15px] font-semibold tracking-tight md:text-[16px]"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
