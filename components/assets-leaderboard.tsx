"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ASSETS_DATA, AssetItem, AssetCategory } from "@/lib/assets-data";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type SortField = "name" | "model" | "price" | "downloads" | null;
type SortDirection = "asc" | "desc";

const FILTER_PILLS: { label: string; value: AssetCategory | null }[] = [
  { label: "All", value: null },
  { label: "Sessions", value: "session" },
  { label: "Context", value: "context" },
  { label: "Traces", value: "trace" },
  { label: "Tool runs", value: "tool run" },
  { label: "Retrievals", value: "retrieval" },
  { label: "Memory", value: "memory" },
  { label: "Artifacts", value: "artifact" },
  { label: "Evals", value: "evaluation" },
  { label: "Observability", value: "observability" },
  { label: "Error Analysis", value: "error analysis" },
];

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

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function AssetsLeaderboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "trending" | "hot" | "free" | "new">("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, activeTab]);

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
      if (selectedCategory && asset.category !== selectedCategory) {
        return false;
      }

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
  }, [search, selectedCategory, activeTab, sortField, sortDirection]);

  const totalPages = Math.ceil(processedAssets.length / pageSize) || 1;

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedAssets.slice(start, start + pageSize);
  }, [processedAssets, currentPage, pageSize]);

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
      <h2 className="text-sm font-mono font-medium tracking-wider text-white uppercase mb-4">
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

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none scroll-smooth">
        {FILTER_PILLS.map((pill) => {
          const isActive = selectedCategory === pill.value;
          return (
            <button
              key={pill.label}
              type="button"
              onClick={() => setSelectedCategory(isActive && pill.value !== null ? null : pill.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                isActive
                  ? "bg-[#97E600]/15 text-[#97E600] border-[#97E600]/50 shadow-[0_0_12px_rgba(151,230,0,0.15)]"
                  : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/60"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
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

      {/* Table Component */}
      <Table>
        <TableHeader className="border-b border-neutral-800/80">
          <TableRow className="border-b border-neutral-800/80 hover:bg-transparent">
            <TableHead className="w-12 text-neutral-500 font-mono font-medium text-xs uppercase px-3 py-3">
              #
            </TableHead>
            <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
              <button
                type="button"
                onClick={() => handleSort("name")}
                className="flex items-center hover:text-white transition-colors group/btn"
              >
                Asset {renderSortIndicator("name")}
              </button>
            </TableHead>
            <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 hidden lg:table-cell">
              <button
                type="button"
                onClick={() => handleSort("model")}
                className="flex items-center hover:text-white transition-colors group/btn"
              >
                Model {renderSortIndicator("model")}
              </button>
            </TableHead>
            <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right hidden lg:table-cell">
              <button
                type="button"
                onClick={() => handleSort("price")}
                className="flex items-center justify-end w-full hover:text-white transition-colors group/btn"
              >
                Price {renderSortIndicator("price")}
              </button>
            </TableHead>
            <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right hidden lg:table-cell">
              <span className="cursor-default">30D Activity</span>
            </TableHead>
            <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right">
              <button
                type="button"
                onClick={() => handleSort("downloads")}
                className="flex items-center justify-end w-full hover:text-white transition-colors group/btn"
              >
                Downloads {renderSortIndicator("downloads")}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-neutral-900">
          {processedAssets.length === 0 ? (
            <TableRow className="hover:bg-transparent border-b-0">
              <TableCell colSpan={6} className="py-12 text-center text-neutral-500 font-mono text-sm">
                No assets matching &quot;{search}&quot;
              </TableCell>
            </TableRow>
          ) : (
            paginatedAssets.map((asset, index) => (
              <TableRow
                key={asset.id}
                onClick={() => router.push(`/assets/${asset.id}`)}
                className="border-b border-neutral-900 hover:bg-neutral-900/60 transition-colors group cursor-pointer"
              >
                {/* Sequential Rank Index (1, 2, 3...) */}
                <TableCell className="font-mono text-sm text-neutral-500 px-3 py-3">
                  {(currentPage - 1) * pageSize + index + 1}
                </TableCell>

                {/* Asset Info */}
                <TableCell className="px-3 py-3 min-w-0">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Link
                        href={`/assets/${asset.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-white group-hover:text-[#97E600] transition-colors text-sm sm:text-base truncate"
                      >
                        {asset.name}
                      </Link>
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
                </TableCell>

                {/* Model (Desktop) */}
                <TableCell className="hidden lg:table-cell px-3 py-3">
                  <span className="text-xs font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                    {asset.model}
                  </span>
                </TableCell>

                {/* Price (Desktop) */}
                <TableCell className="hidden lg:table-cell px-3 py-3 text-right">
                  <span className="text-xs font-mono font-medium text-[#97E600] bg-[#97E600]/10 border border-[#97E600]/30 px-2 py-0.5 rounded-full">
                    {asset.price}
                  </span>
                </TableCell>

                {/* Sparkline Graphic (Desktop) */}
                <TableCell className="hidden lg:table-cell px-3 py-3 text-right">
                  <div className="flex justify-end">
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
                </TableCell>

                {/* Downloads */}
                <TableCell className="px-3 py-3 text-right font-mono text-sm text-white font-medium">
                  {asset.downloads}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {processedAssets.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-900 font-mono text-xs text-neutral-400">
          <div>
            Showing <span className="text-white font-medium">{(currentPage - 1) * pageSize + 1}</span>-
            <span className="text-white font-medium">
              {Math.min(currentPage * pageSize, processedAssets.length)}
            </span>{" "}
            of <span className="text-white font-medium">{processedAssets.length}</span> assets
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Previous
            </button>

            {getPageNumbers(currentPage, totalPages).map((page, idx) => {
              if (page === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-neutral-600 select-none">
                    ...
                  </span>
                );
              }
              const isCurrent = currentPage === page;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer font-medium ${
                    isCurrent
                      ? "bg-[#97E600]/15 text-[#97E600] border border-[#97E600]/40 shadow-[0_0_8px_rgba(151,230,0,0.15)]"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
