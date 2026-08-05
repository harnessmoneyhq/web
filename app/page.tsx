import { HeroSection } from "@/components/hero-section";
import { AssetsLeaderboard } from "@/components/assets-leaderboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-neutral-800 selection:text-white">
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Banner & Agents Marquee */}
        <HeroSection />

        {/* Assets Leaderboard */}
        <AssetsLeaderboard />
      </main>
    </div>
  );
}
