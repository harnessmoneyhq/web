import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { AssetsLeaderboard } from "@/components/assets-leaderboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-neutral-800 selection:text-white">
      {/* Sticky Header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Banner & Agents Marquee */}
        <HeroSection />

        {/* Assets Leaderboard */}
        <AssetsLeaderboard />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <p>
            © {new Date().getFullYear()}{" "}
            <a
              href="https://www.ivanmolto.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              Ivan Molto
            </a>{" "}
            • Built with ♥ from sunny Malta
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://www.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              Powered by Arc
            </a>
            <a
              href="https://github.com/harnessmoneyhq"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
