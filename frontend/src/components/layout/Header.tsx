export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#D7D0C5] bg-[#F8F5EF]/95 px-8 py-5 shadow-[0_8px_30px_rgba(44,44,44,0.05)] backdrop-blur">
      <div>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[#B08D57]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7A826E]">
            Rouke Ranch Intelligence
          </p>
        </div>

        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[#1E3A34]">
          Mission Control
        </h1>

        <p className="mt-1 font-editorial text-xs italic text-[#7A826E]">
          Stewarding what matters, one decision at a time.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-[#B08D57]/40 bg-white/60 px-4 py-2.5 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-[#7A826E]" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B08D57]">
            Executive AI
          </p>
          <p className="text-xs font-bold text-[#1E3A34]">
            Jarvis Online
          </p>
        </div>
      </div>
    </header>
  );
}