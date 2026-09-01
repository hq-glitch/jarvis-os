"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Tasks", href: "/tasks" },
  { name: "Calendar", href: "/calendar" },
  { name: "Inbox", href: "/inbox" },
  { name: "Memory", href: "/memory" },
  { name: "Pepperdine", href: "/pepperdine" },
  { name: "Rouke Ranch", href: "/ranch" },
  { name: "Social Media", href: "/social-media" },
  { name: "Income Lab", href: "/income-lab" },
  { name: "Finance", href: "/finance" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-[#B08D57]/30 bg-[#142A26] px-6 py-7 text-[#F8F5EF] shadow-[10px_0_40px_rgba(20,42,38,0.12)]">
      <div className="border-b border-[#B08D57]/30 pb-7">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#B08D57]/70 bg-[#1E3A34] font-display text-2xl font-semibold tracking-[-0.08em] text-[#D7B77C] shadow-inner">
            RR
          </div>

          <div>
            <p className="font-display text-xl font-semibold tracking-[0.12em] text-[#F8F5EF]">
              ROUKE RANCH
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-[#B08D57]">
              Executive OS
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#B08D57]/50" />
          <span className="font-editorial text-[10px] italic tracking-wide text-[#D7D0C5]">
            Legacy lives here
          </span>
          <span className="h-px flex-1 bg-[#B08D57]/50" />
        </div>
      </div>

      <nav className="mt-7 flex-1 space-y-1.5">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                isActive
                  ? "border-[#B08D57]/50 bg-[#F8F5EF]/10 text-[#F8F5EF] shadow-sm"
                  : "border-transparent text-[#D7D0C5] hover:border-[#B08D57]/20 hover:bg-[#F8F5EF]/5 hover:text-white"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  isActive
                    ? "bg-[#D7B77C]"
                    : "bg-[#7A826E] group-hover:bg-[#B08D57]"
                }`}
              />
              <span className={isActive ? "font-bold" : ""}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-xl border border-[#B08D57]/30 bg-[#1E3A34]/80 p-4 shadow-inner">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#B08D57]">
          System status
        </p>

        <div className="mt-3 flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A8B49A] opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#A8B49A]" />
          </span>
          <span className="text-sm text-[#F8F5EF]">
            Jarvis is online
          </span>
        </div>
      </div>
    </aside>
  );
}
