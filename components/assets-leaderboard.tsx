"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ASSETS_DATA, AssetItem } from "@/lib/assets-data";

type SortField = "name" | "model" | "price" | "downloads" | null;
type SortDirection = "asc" | "desc";

function parsePrice(price: string): number {
  if (price.toLowerCase() === "free") return 0;
  const match = price.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseDownloads(downloads: string): number {
  const clean = downloads.toUpperCase().trim();
  if (clean.endsWith("M")) {
    return parseFloat(clean.replace("M", "")) * 1_000_000;
  }
  if (clean.endsWith("K")) {
    return parseFloat(clean.replace("K", "")) * 1_000;
  }
  return parseFloat(clean) || 0;
}

export function AssetsLeaderboard() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "trending" | "hot" | "free" | "new">("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts ('/' to focus, 'Escape' to clear/blur)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setSearch("");
        inputRef.current?.blur();
        return;
      }

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClearSearch = () => {
    setSearch("");
    inputRef.current?.focus();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "downloads" || field === "price" ? "desc" : "asc");
    }
  };

  const processedAssets = useMemo(() => {
    const filtered = ASSETS_DATA.filter((asset: AssetItem) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.category.toLowerCase().includes(search.toLowerCase()) ||
        asset.model.toLowerCase().includes(search.toLowerCase()) ||
        asset.price.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (activeTab === "all") return true;
      if (activeTab === "featured") return !!asset.official;
      if (activeTab === "trending") return !!asset.isTrending;
      if (activeTab === "hot") return !!asset.isHot;
      if (activeTab === "free") return asset.price.toLowerCase() === "free" || asset.price === "$0.00";
      if (activeTab === "new") return !!asset.isNew;
      return true;
    });

    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "model":
          aVal = a.model.toLowerCase();
          bVal = b.model.toLowerCase();
          break;
        case "price":
          aVal = parsePrice(a.price);
          bVal = parsePrice(b.price);
          break;
        case "downloads":
          aVal = parseDownloads(a.downloads);
          bVal = parseDownloads(b.downloads);
          break;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [search, activeTab, sortField, sortDirection]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <span className="text-neutral-700 group-hover/btn:text-neutral-400 transition-colors ml-1">
          ↕
        </span>
      );
    }
    return (
      <span className="text-[#97E600] font-bold ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <section className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Title */}
      <h2 className="text-xs font-mono font-medium tracking-wider text-white uppercase mb-4">
        Leaderboard
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
          placeholder="Discover assets..."
          className="w-full font-mono text-sm py-3 pl-9 pr-12 bg-neutral-900/60 border-b border-neutral-800 focus:border-[#97E600]/50 focus:outline-none text-white placeholder-neutral-500 transition-colors"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {search ? (
            <button
              type="button"
              onClick={handleClearSearch}
              title="Clear search (Esc)"
              className="p-1 text-neutral-400 hover:text-white transition-colors rounded hover:bg-neutral-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="hidden sm:flex items-center pointer-events-none">
              <kbd className="text-xs text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-800 font-mono bg-neutral-950">
                /
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-6 mb-4 font-mono text-sm border-b border-neutral-900 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-2 transition-colors ${activeTab === "all"
            ? "border-b-2 border-white text-white font-medium"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          All Time
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("featured")}
          className={`pb-2 transition-colors ${activeTab === "featured"
            ? "border-b-2 border-white text-white font-medium"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          Featured
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trending")}
          className={`pb-2 transition-colors ${activeTab === "trending"
            ? "border-b-2 border-white text-white font-medium"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          Trending (24h)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hot")}
          className={`pb-2 transition-colors ${activeTab === "hot"
            ? "border-b-2 border-white text-white font-medium"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          Top Movers (1h)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("new")}
          className={`pb-2 transition-colors ${activeTab === "new"
            ? "border-b-2 border-white text-white font-medium"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          New
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("free")}
          className={`pb-2 transition-colors ${activeTab === "free"
            ? "border-b-2 border-white text-white font-medium"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          Free
        </button>
      </div>

      {/* Table Header with Interactive Column Sorting */}
      <div className="hidden lg:grid grid-cols-12 gap-4 border-b border-neutral-800/80 py-3 text-xs font-mono font-medium uppercase text-neutral-500">
        <div className="col-span-1 text-neutral-500">#</div>

        <div className="col-span-4">
          <button
            type="button"
            onClick={() => handleSort("name")}
            className="flex items-center hover:text-white transition-colors group/btn"
          >
            Asset {renderSortIndicator("name")}
          </button>
        </div>

        <div className="col-span-2">
          <button
            type="button"
            onClick={() => handleSort("model")}
            className="flex items-center hover:text-white transition-colors group/btn"
          >
            Model {renderSortIndicator("model")}
          </button>
        </div>

        <div className="col-span-2 text-right">
          <button
            type="button"
            onClick={() => handleSort("price")}
            className="flex items-center justify-end w-full hover:text-white transition-colors group/btn"
          >
            Price {renderSortIndicator("price")}
          </button>
        </div>

        <div className="col-span-2 text-right">
          <span className="cursor-default">30D Activity</span>
        </div>

        <div className="col-span-1 text-right">
          <button
            type="button"
            onClick={() => handleSort("downloads")}
            className="flex items-center justify-end w-full hover:text-white transition-colors group/btn"
          >
            Downloads {renderSortIndicator("downloads")}
          </button>
        </div>
      </div>

      {/* Table Items */}
      <div>
        {processedAssets.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 font-mono text-sm">
            No assets matching &quot;{search}&quot;
          </div>
        ) : (
          processedAssets.map((asset, index) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-12 items-center gap-3 lg:gap-4 py-3 border-b border-neutral-900 hover:bg-neutral-900/60 transition-colors group cursor-pointer text-left"
            >
              {/* Sequential Rank Index (1, 2, 3...) */}
              <div className="lg:col-span-1 text-sm text-neutral-500 font-mono">
                {index + 1}
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
                    >
                      <title>Official Asset</title>
                      <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.81.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2 3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-neutral-400 font-mono capitalize truncate">
                  {asset.category}
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
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
