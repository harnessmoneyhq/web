"use client";

import { useState } from "react";
import Link from "next/link";
import { AssetItem } from "@/lib/assets-data";

interface AssetDetailViewProps {
  asset: AssetItem;
  hasContent?: boolean;
}

export function AssetDetailView({ asset, hasContent }: AssetDetailViewProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<"curl" | "typescript" | "python">("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [unlockedContent, setUnlockedContent] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(asset.endpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(asset.codeSnippets[activeSnippetTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 selection:bg-[#97E600]/30 selection:text-[#97E600] flex flex-col">
      {/* Top Header / Navigation Bar */}
      <div className="bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Leaderboard</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Main Header Info */}
        <div className="mb-10 pb-8 border-b border-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {asset.name}
              </h1>
              {asset.official && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#97E600] bg-[#97E600]/10 border border-[#97E600]/30 px-2 py-0.5 rounded-full">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.81.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82 1.89 3.2 3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                  </svg>
                  Official
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                Model: <span className="text-white font-medium">{asset.model}</span>
              </span>
              <span className="text-xs font-semibold text-[#97E600] bg-[#97E600]/10 border border-[#97E600]/30 px-3 py-1 rounded-full">
                {asset.price}
              </span>
            </div>
          </div>
          <p className="text-sm font-mono text-neutral-500">
            Execution Category: <span className="text-white capitalize font-medium">{asset.category}</span>
          </p>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left / Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Section */}
            <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6">
              <h2 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Overview & Capabilities
              </h2>
              <p className="text-neutral-300 leading-relaxed text-sm sm:text-base">
                {asset.description}
              </p>
            </section>

            {/* Endpoint Section */}
            <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                  API Endpoint
                </h2>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  x402 USDC Standard
                </span>
              </div>

              {/* Endpoint Display Box */}
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 p-3 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto">
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                    asset.httpMethod === "POST"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {asset.httpMethod}
                </span>
                <code className="text-neutral-200 flex-1 truncate">{asset.endpoint}</code>
                <button
                  type="button"
                  onClick={handleCopyEndpoint}
                  className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded font-mono transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedEndpoint ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#97E600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[#97E600]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Code Snippets Section */}
            <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                  Integration Code Snippets
                </h2>
                {/* Language Tabs */}
                <div className="flex gap-2 font-mono text-xs">
                  {(["curl", "typescript", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveSnippetTab(lang)}
                      className={`px-2.5 py-1 rounded transition-colors uppercase ${
                        activeSnippetTab === lang
                          ? "bg-neutral-800 text-white font-medium border border-neutral-700"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {lang === "typescript" ? "TypeScript" : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Box */}
              <div className="relative group bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-300 overflow-x-auto">
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="absolute top-3 right-3 opacity-80 group-hover:opacity-100 px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors flex items-center gap-1"
                >
                  {copiedSnippet ? "Copied!" : "Copy Code"}
                </button>
                <pre className="pr-16 leading-relaxed whitespace-pre-wrap">
                  {asset.codeSnippets[activeSnippetTab]}
                </pre>
              </div>
            </section>

            {/* Premium Content Section */}
            {hasContent && (
              <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                    Premium Content
                  </h2>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    x402 Gated
                  </span>
                </div>

                {unlockedContent ? (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-sm text-neutral-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                    {unlockedContent}
                  </div>
                ) : (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-8 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#97E600]/10 border border-[#97E600]/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#97E600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-mono text-white font-medium mb-1">
                        Full AI execution content
                      </p>
                      <p className="text-xs font-mono text-neutral-500">
                        Pay {asset.price} USDC to unlock the complete output
                      </p>
                    </div>
                    {unlockError && (
                      <p className="text-xs font-mono text-red-400 text-center">
                        {unlockError}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={unlocking}
                      onClick={async () => {
                        setUnlocking(true);
                        setUnlockError(null);
                        try {
                          const res = await fetch(`/api/assets/${asset.id}/content`);
                          if (res.status === 402) {
                            const paymentRequired = res.headers.get("PAYMENT-REQUIRED");
                            setUnlockError(
                              paymentRequired
                                ? "Payment required — use an x402 client to unlock this content."
                                : "Payment required."
                            );
                          } else if (res.ok) {
                            const data = await res.json();
                            setUnlockedContent(data.content);
                          } else {
                            setUnlockError("Failed to unlock content.");
                          }
                        } catch {
                          setUnlockError("Network error. Please try again.");
                        } finally {
                          setUnlocking(false);
                        }
                      }}
                      className="px-6 py-3 bg-[#97E600] hover:bg-[#85cc00] disabled:opacity-50 text-black font-semibold rounded-lg font-mono text-sm transition-colors flex items-center gap-2"
                    >
                      {unlocking ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Unlocking...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          <span>Unlock Content — {asset.price} USDC</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Detailed 30D Stats & Telemetry Section */}
            <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                    30D Activity & Telemetry
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    Real-time execution analytics across 30 days
                  </p>
                </div>
                <span className="text-xs font-mono text-[#97E600] bg-[#97E600]/10 border border-[#97E600]/30 px-2.5 py-1 rounded-full">
                  Live Feed
                </span>
              </div>

              {/* 30D Sparkline Area Graph */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg mb-6">
                <div className="h-32 w-full flex items-end">
                  <svg viewBox="0 0 400 100" className="w-full h-full text-[#97E600]">
                    <defs>
                      <linearGradient id="gradient30d" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#97E600" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#97E600" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <polygon
                      points={`0,100 ${asset.sparkline
                        .map((val, idx) => `${idx * 57 + 2},${100 - (val / 50) * 80}`)
                        .join(" ")} 400,100`}
                      fill="url(#gradient30d)"
                    />
                    {/* Line */}
                    <path
                      d={`M ${asset.sparkline
                        .map((val, idx) => `${idx * 57 + 2},${100 - (val / 50) * 80}`)
                        .join(" L ")}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-lg">
                  <span className="text-[11px] text-neutral-500 uppercase block mb-1">30D Calls</span>
                  <span className="text-base sm:text-lg font-bold text-white">{asset.stats.calls30d}</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-lg">
                  <span className="text-[11px] text-neutral-500 uppercase block mb-1">Avg Latency</span>
                  <span className="text-base sm:text-lg font-bold text-[#97E600]">{asset.stats.latency}</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-lg">
                  <span className="text-[11px] text-neutral-500 uppercase block mb-1">Uptime</span>
                  <span className="text-base sm:text-lg font-bold text-white">{asset.stats.uptime}</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-lg">
                  <span className="text-[11px] text-neutral-500 uppercase block mb-1">Success Rate</span>
                  <span className="text-base sm:text-lg font-bold text-white">{asset.stats.successRate}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Purchase & Action Card */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 space-y-5">
              <div>
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1">
                  Pricing Model
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#97E600] font-mono">
                    {asset.price}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">/ API call</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 font-mono">
                  Settled instantly via Circle USDC Gateway
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCopyEndpoint}
                  className="w-full py-3 bg-[#97E600] hover:bg-[#85cc00] text-black font-semibold rounded-lg font-mono text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Call API Endpoint</span>
                </button>

                <a
                  href={asset.endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg font-mono text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>View Execution Spec</span>
                </a>
              </div>
            </div>

            {/* Asset Metadata List */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-6 space-y-4 font-mono text-xs">
              <h3 className="font-medium text-neutral-400 uppercase tracking-wider">
                Asset Metadata
              </h3>
              <div className="divide-y divide-neutral-800/60">
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-500">Total Downloads</span>
                  <span className="text-white font-medium">{asset.downloads}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-500">Category</span>
                  <span className="text-white capitalize">{asset.category}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-500">Model Architecture</span>
                  <span className="text-white">{asset.model}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-500">Verification</span>
                  <span className={asset.official ? "text-[#97E600]" : "text-neutral-400"}>
                    {asset.official ? "Verified Publisher" : "Community Asset"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
