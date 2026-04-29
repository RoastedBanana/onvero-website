const partners = ['n8n', 'Figma', 'Anthropic', 'OpenAI', 'Cursor', 'Supabase'];

export function LogoBar() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-[#C1C9D2]/40 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-16 py-6 md:py-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-16 gap-y-3 text-[#697386]/60">
          {partners.map((p) => (
            <li
              key={p}
              className="text-[15px] md:text-[16px] font-semibold tracking-tight"
            >
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
