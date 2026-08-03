import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-neutral-900">
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
        <nav className="flex items-center gap-6 text-sm font-sans">
          <Link
            href="/sellers"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Sellers
          </Link>
          <Link
            href="/transactions"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Transactions
          </Link>
          <Link
            href="/agents"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Agents
          </Link>

        </nav>
      </div>
    </header>
  );
}
