"use client";

import { useState, useMemo, useEffect, useRef } from "react";

interface AssetItem {
  rank: number;
  name: string;
  repo: string;
  model: string;
  price: string;
  downloads: string;
  sparkline: number[];
  category: "all" | "trending" | "hot";
  official?: boolean;
}

const ASSETS_DATA: AssetItem[] = [
  {
    rank: 1,
    name: "128K Context Window Pack",
    repo: "google/context-windows",
    model: "gemini-3.5",
    price: "0.25 USDC",
    downloads: "2.8M",
    sparkline: [40, 45, 42, 44, 41, 41, 46, 43],
    category: "all",
    official: true,
  },
  {
    rank: 2,
    name: "Realtime Crypto Market Intelligence",
    repo: "circle/market-data",
    model: "opus-5",
    price: "0.75 USDC",
    downloads: "850.4K",
    sparkline: [30, 32, 29, 28, 26, 28, 26, 25],
    category: "all",
    official: true,
  },
  {
    rank: 3,
    name: "Extended 1M Context Buffer",
    repo: "google/context-windows",
    model: "gemini-3.5",
    price: "1.00 USDC",
    downloads: "730.6K",
    sparkline: [15, 20, 25, 26, 28, 45, 43, 42],
    category: "trending",
  },
  {
    rank: 4,
    name: "Web Search & Live Scraper Bundle",
    repo: "openai/web-tools",
    model: "gpt-5.5",
    price: "0.15 USDC",
    downloads: "640.0K",
    sparkline: [16, 21, 24, 23, 25, 41, 39, 36],
    category: "trending",
  },
  {
    rank: 5,
    name: "Deep Academic Research Index",
    repo: "anthropic/research",
    model: "opus-5",
    price: "0.50 USDC",
    downloads: "614.1K",
    sparkline: [25, 24, 22, 23, 21, 25, 23, 21],
    category: "all",
    official: true,
  },
  {
    rank: 6,
    name: "Solana Onchain Analytics Engine",
    repo: "circle/agent-analytics",
    model: "gpt-5.5",
    price: "0.30 USDC",
    downloads: "485.2K",
    sparkline: [10, 15, 22, 30, 38, 42, 48, 50],
    category: "hot",
    official: true,
  },
  {
    rank: 7,
    name: "Live News & Sentiment Feed",
    repo: "reuters/live-sentiment",
    model: "claude-3.7",
    price: "0.20 USDC",
    downloads: "412.9K",
    sparkline: [20, 22, 25, 28, 30, 33, 35, 38],
    category: "hot",
    official: true,
  },
  {
    rank: 8,
    name: "256K High-Speed Memory Window",
    repo: "meta/llama-context",
    model: "llama-4",
    price: "Free",
    downloads: "358.1K",
    sparkline: [12, 18, 24, 29, 34, 38, 42, 45],
    category: "trending",
  },
  {
    rank: 9,
    name: "Prediction Market Odds API",
    repo: "polymarket/odds-api",
    model: "opus-5",
    price: "0.75 USDC",
    downloads: "310.4K",
    sparkline: [14, 19, 23, 27, 31, 36, 40, 44],
    category: "hot",
    official: true,
  },
  {
    rank: 10,
    name: "High-Throughput Weather Stream",
    repo: "noaa/weather-stream",
    model: "gpt-5.5",
    price: "0.05 USDC",
    downloads: "289.0K",
    sparkline: [18, 20, 22, 24, 27, 29, 31, 33],
    category: "all",
  },
];

export function AssetsLeaderboard() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "trending" | "hot">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredAssets = useMemo(() => {
    return ASSETS_DATA.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.repo.toLowerCase().includes(search.toLowerCase()) ||
        asset.model.toLowerCase().includes(search.toLowerCase()) ||
        asset.price.toLowerCase().includes(search.toLowerCase());

      if (activeTab === "all") return matchesSearch;
      return matchesSearch && asset.category === activeTab;
    });
  }, [search, activeTab]);

  return (
    <section className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Title */}
      <h2 className="text-xs font-mono font-medium tracking-wider text-white uppercase mb-4">
        Assets Leaderboard
      </h2>

      {/* Search Input Bar */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-4 w-4 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets, models, prices..."
          className="w-full font-mono text-sm py-3 pl-9 pr-12 bg-neutral-900/60 border-b border-neutral-800 focus:border-neutral-500 focus:outline-none text-white placeholder-neutral-500 transition-colors"
        />
        <div className="hidden sm:flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none">
          <kbd className="text-xs text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-800 font-mono bg-neutral-950">
            /
          </kbd>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-6 mb-4 font-mono text-sm border-b border-neutral-900 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-2 transition-colors ${
            activeTab === "all"
              ? "border-b-2 border-white text-white font-medium"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          All Time (7,404,200)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trending")}
          className={`pb-2 transition-colors ${
            activeTab === "trending"
              ? "border-b-2 border-white text-white font-medium"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Trending (24h)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hot")}
          className={`pb-2 transition-colors ${
            activeTab === "hot"
              ? "border-b-2 border-white text-white font-medium"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Hot
        </button>
      </div>

      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 border-b border-neutral-800/80 py-3 text-xs font-mono font-medium uppercase text-neutral-500">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Asset</div>
        <div className="col-span-2">Model</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">8W Activity</div>
        <div className="col-span-1 text-right">Downloads</div>
      </div>

      {/* Table Items */}
      <div className="divide-y divide-neutral-900">
        {filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 font-mono text-sm">
            No assets matching &quot;{search}&quot;
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <div
              key={asset.rank}
              className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-12 items-center gap-3 lg:gap-4 py-3 hover:bg-neutral-900/40 transition-colors group cursor-pointer"
            >
              {/* Rank */}
              <div className="lg:col-span-1 text-sm text-neutral-500 font-mono">
                {asset.rank}
              </div>

              {/* Asset Info */}
              <div className="lg:col-span-4 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-[#97E600] transition-colors text-sm sm:text-base truncate">
                    {asset.name}
                  </h3>
                  {asset.official && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-[#97E600] flex-shrink-0"
                      fill="currentColor"
                      title="Official Asset"
                    >
                      <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.81.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2 3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-neutral-500 font-mono truncate">
                  {asset.repo}
                </span>
                {/* Mobile-only tags for Model & Price */}
                <div className="flex lg:hidden items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                    {asset.model}
                  </span>
                  <span className="text-[10px] font-mono text-[#97E600] bg-[#97E600]/10 border border-[#97E600]/30 px-1.5 py-0.5 rounded-full font-medium">
                    {asset.price}
                  </span>
                </div>
              </div>

              {/* Model (Desktop) */}
              <div className="hidden lg:flex lg:col-span-2 items-center">
                <span className="text-xs font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                  {asset.model}
                </span>
              </div>

              {/* Price (Desktop) */}
              <div className="hidden lg:flex lg:col-span-2 items-center justify-end">
                <span className="text-xs font-mono font-medium text-[#97E600] bg-[#97E600]/10 border border-[#97E600]/30 px-2 py-0.5 rounded-full">
                  {asset.price}
                </span>
              </div>

              {/* Sparkline Graphic (Desktop) */}
              <div className="hidden lg:flex lg:col-span-2 items-center justify-end">
                <svg
                  viewBox="0 0 96 24"
                  className="h-6 w-24 text-neutral-600 group-hover:text-[#97E600] transition-colors"
                >
                  <path
                    d={`M ${asset.sparkline
                      .map((val, idx) => `${idx * 13.7 + 2},${24 - (val / 50) * 20}`)
                      .join(" L ")}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Downloads */}
              <div className="lg:col-span-1 text-right font-mono text-sm text-white font-medium">
                {asset.downloads}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
