export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Mission Control
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Welcome back, Sarah.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2">
        <p className="text-sm text-slate-300">
          Jarvis Online
        </p>
      </div>
    </header>
  );
}