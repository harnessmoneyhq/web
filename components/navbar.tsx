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
              height="20"
              width="20"
              viewBox="0 0 100 100"
              fill="none"
            >
              <rect x="6" y="6" width="88" height="88" rx="22" stroke="#97E600" strokeWidth="6.5" />
              <rect x="24" y="24" width="52" height="52" rx="15" stroke="#97E600" strokeWidth="5.5" />
              <rect x="46" y="34" width="24" height="24" rx="7" fill="#97E600" />
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
