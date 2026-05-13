import Link from 'next/link';
import { Button } from '@onvero/ui/primitives/button';
import { Navbar } from './Navbar';
import { PhoneMockup } from './PhoneMockup';

const trustedBy = ['n8n', 'Figma', 'Anthropic', 'OpenAI', 'Cursor', 'Supabase'];

export function HeroSection() {
  return (
    <div className="bg-white font-[family-name:var(--font-inter)] text-[#0A2540]">
      <Navbar />
      <section className="overflow-hidden">
        <div className="pt-28 pb-20 md:pt-36 md:pb-32">
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            {/* Split layout: text left, phone right */}
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
              {/* Left: text content */}
              <div className="flex-1 text-center lg:text-left">
                <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#4F46E5]">
                  KI-Infrastruktur für den Mittelstand
                </p>

                <h1 className="max-w-2xl text-balance text-4xl font-bold tracking-[-0.02em] leading-[1.1] md:text-5xl lg:text-[52px] lg:leading-[1.05]">
                  Turning Fragmented Business Operations into an AI-Powered Orchestra
                </h1>

                <p className="my-6 max-w-xl text-balance text-lg font-medium leading-[1.45] text-[#425466] md:text-xl">
                  We build AI-powered business systems tailored to your industry, your processes, and your customers —
                  ready from day one.
                </p>

                <div className="flex flex-col items-center justify-center gap-3 *:w-full sm:flex-row sm:*:w-auto lg:justify-start">
                  <Button asChild size="lg" className="bg-[#4F46E5] text-white shadow-sm hover:bg-[#4338CA]">
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

              {/* Right: phone mockup */}
              <div className="flex shrink-0 items-center justify-center lg:justify-end">
                <PhoneMockup />
              </div>
            </div>

            <div className="mt-16 md:mt-20">
              <p className="text-center text-sm text-[#697386]">Trusted by teams at:</p>
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[#697386]/60 md:gap-x-14">
                {trustedBy.map((p) => (
                  <li key={p} className="text-[15px] font-semibold tracking-tight md:text-[16px]">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
