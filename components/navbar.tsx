"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "Sellers", href: "/sellers" },
  { name: "Transactions", href: "/transactions" },
  { name: "Agents", href: "/agents" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-900">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Harness Logo */}
          <Link
            title="Harness Money"
            href="/"
            className="hover:opacity-80 transition-opacity flex items-center"
          >
            <svg
              height="24"
              width="24"
              viewBox="0 0 200 200"
              fill="none"
            >
              <defs>
                <linearGradient id="nav-neon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D9FF3F" />
                  <stop offset="100%" stopColor="#97E600" />
                </linearGradient>
              </defs>
              <rect x="20" y="20" width="160" height="160" rx="32" fill="none" stroke="#97E600" strokeWidth="10" />
              <path
                d="M 76 46 L 140 46 A 22 22 0 0 1 162 68 C 157 86, 157 114, 162 132 A 22 22 0 0 1 140 154 L 76 154 A 22 22 0 0 1 54 132 L 54 68 A 22 22 0 0 1 76 46 Z"
                fill="none"
                stroke="#B8FF4D"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="97" y="72" width="56" height="56" rx="14" fill="url(#nav-neon-gradient)" />
            </svg>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-6 text-sm font-mono">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative py-1.5 transition-colors ${
                  isActive
                    ? "text-white font-medium"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#97E600] rounded-full shadow-[0_0_8px_rgba(151,230,0,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
