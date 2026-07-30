import Link from "next/link";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Calendar", href: "/calendar" },
  { name: "Inbox", href: "/inbox" },
  { name: "Memory", href: "/memory" },
  { name: "Pepperdine", href: "/pepperdine" },
  { name: "Rouke Ranch", href: "/ranch" },
  { name: "Finance", href: "/finance" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="min-h-screen w-64 border-r border-slate-800 bg-slate-950 px-5 py-8 text-slate-100">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-blue-400">
          Personal OS
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Jarvis</h1>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          System status
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-slate-300">Jarvis is online</span>
        </div>
      </div>
    </aside>
  );
}