"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/kb", label: "Knowledge Base" },
  { href: "/tasks", label: "Tasks" },
  { href: "/contributors", label: "Contributors" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          className="mr-1 rounded p-1 text-zinc-400 hover:bg-zinc-800 lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
        <Link href="/" className="text-lg font-bold text-zinc-100">
          Open Lab
        </Link>
        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
          Phase 1
        </span>
      </div>
      <div className="text-xs text-zinc-500">Distributed AI Research</div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="absolute left-0 top-14 w-full border-b border-zinc-800 bg-zinc-950 p-3 lg:hidden">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
