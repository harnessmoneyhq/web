"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    TooltipProvider,
} from "@/components/ui/tooltip";
import {
    Store,
    DollarSign,
    Unlock,
    Package,
} from "lucide-react";
import { shortenHash, formatUsdcAmount, parseAmount, formatCount } from "@/lib/utils";
import { useSellers, Seller } from "@/hooks/use-sellers";
import { CopyableCell } from "@/components/copyable-cell";
import { Identicon } from "@/components/identicon";
import { DataTable, ColumnDef } from "@/components/data-table";

export default function SellersPage() {
    const router = useRouter();
    const { sellers, loading, error, retry } = useSellers();
    const [copied, setCopied] = useState(false);

    const totalRevenue = useMemo(() => {
        return sellers.reduce((acc, s) => acc + parseAmount(s.total_revenue_usdc), 0);
    }, [sellers]);

    const totalSales = useMemo(() => {
        return sellers.reduce((acc, s) => acc + s.total_sales, 0);
    }, [sellers]);

    const totalAssetsListed = useMemo(() => {
        return sellers.reduce((acc, s) => acc + s.assets_count, 0);
    }, [sellers]);

    const handleCopy = () => {
        navigator.clipboard.writeText("Copy prompt to start selling");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const searchFilter = useCallback((s: Seller, query: string) => {
        return (
            s.name.toLowerCase().includes(query) ||
            s.address.toLowerCase().includes(query) ||
            s.specialties.some((sp) => sp.toLowerCase().includes(query)) ||
            s.network.toLowerCase().includes(query)
        );
    }, []);

    const columns = useMemo<ColumnDef<Seller>[]>(() => [
        {
            id: "rank",
            header: "#",
            className: "w-10 text-neutral-500",
            cell: (_, __, globalIndex) => globalIndex + 1,
        },
        {
            id: "address",
            header: "SELLER",
            sortable: true,
            defaultSortDirection: "asc",
            getValue: (s) => (s.name ? s.name.toLowerCase() : s.address.toLowerCase()),
            cell: (seller) => (
                <div className="flex items-center gap-2.5 min-w-0">
                    <Identicon address={seller.address} />
                    <CopyableCell
                        value={seller.address}
                        label={shortenHash(seller.address)}
                        href={`/sellers/${seller.address}`}
                    />
                </div>
            ),
        },
        {
            id: "specialties",
            header: "SPECIALIZES IN",
            className: "hidden md:table-cell text-neutral-400",
            cell: (seller) => (
                seller.specialties.length > 0
                    ? seller.specialties.slice(0, 2).join(" · ")
                    : "—"
            ),
        },
        {
            id: "assets",
            header: "LISTED ASSETS",
            sortable: true,
            align: "right",
            className: "text-white font-medium",
            getValue: (s) => s.assets_count,
            cell: (seller) => seller.assets_count,
        },
        {
            id: "sales",
            header: "SALES",
            sortable: true,
            align: "right",
            className: "text-white font-medium",
            getValue: (s) => s.total_sales,
            cell: (seller) => formatCount(seller.total_sales),
        },
        {
            id: "volume",
            header: "VOLUME (USDC)",
            sortable: true,
            align: "right",
            className: "font-medium text-[#97E600]",
            getValue: (s) => parseAmount(s.total_revenue_usdc),
            cell: (seller) => formatUsdcAmount(seller.total_revenue_usdc),
        },
        {
            id: "avg_sale",
            header: "AVG SALE (USDC)",
            sortable: true,
            align: "right",
            className: "hidden sm:table-cell text-neutral-400",
            getValue: (s) => parseAmount(s.avg_sale_usdc),
            cell: (seller) => formatUsdcAmount(seller.avg_sale_usdc),
        },
        {
            id: "last_active",
            header: "LAST ACTIVE",
            sortable: true,
            align: "right",
            className: "hidden lg:table-cell text-neutral-400",
            getValue: (s) => s.last_active,
            cell: (seller) => (
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#97E600] animate-pulse" />
                    {seller.last_active}
                </span>
            ),
        },
    ], []);

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-black text-white flex flex-col selection:bg-neutral-800 selection:text-white">
                <main className="flex-1 py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-sm font-mono font-medium tracking-wider text-white uppercase mb-1">
                                Sellers
                            </h1>
                            <p className="text-neutral-400 font-mono text-xs">
                                Discover wallets publishing and selling valuable AI work
                            </p>
                        </div>
                        <div
                            onClick={handleCopy}
                            className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-colors rounded-lg px-3.5 py-2 font-mono text-xs text-white flex items-center justify-between gap-3 cursor-pointer group self-start sm:self-auto shrink-0"
                        >
                            <code className="relative flex items-center text-[#97E600] font-medium">
                                <span className={copied ? "opacity-0" : "opacity-100 transition-opacity"}>
                                    Copy prompt to start selling
                                </span>
                                {copied && (
                                    <span className="absolute inset-0 flex items-center text-[#97E600] font-medium whitespace-nowrap">
                                        Prompt copied!
                                    </span>
                                )}
                            </code>
                            <button
                                type="button"
                                className="p-1 rounded text-neutral-400 group-hover:text-white transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? (
                                    <svg className="h-4 w-4 text-[#97E600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 002-2h8a2 2 0 002 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Overview Stat Cards Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-mono">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="h-3 w-20 bg-neutral-800 rounded animate-pulse" />
                                        <div className="h-3.5 w-3.5 bg-neutral-800 rounded animate-pulse" />
                                    </div>
                                    <div className="h-7 w-14 bg-neutral-800 rounded animate-pulse mt-2" />
                                    <div className="h-2.5 w-16 bg-neutral-800/60 rounded animate-pulse mt-2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-mono">
                            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                                <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                    <span>Total Sellers</span>
                                    <Store size={14} className="text-[#97E600]" />
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {sellers.length}
                                </div>
                                <div className="text-[10px] text-neutral-500 mt-0.5">All-time</div>
                            </div>

                            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                                <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                    <span>Listed Assets</span>
                                    <Package size={14} className="text-[#97E600]" />
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {totalAssetsListed}
                                </div>
                                <div className="text-[10px] text-neutral-500 mt-0.5">Assets currently published by sellers</div>
                            </div>

                            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                                <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                    <span>Asset Unlocks</span>
                                    <Unlock size={14} className="text-[#97E600]" />
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {formatCount(totalSales)}
                                </div>
                                <div className="text-[10px] text-neutral-500 mt-0.5">Successful paid accesses</div>
                            </div>

                            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                                <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                    <span>Sellers Volume</span>
                                    <DollarSign size={14} className="text-[#97E600]" />
                                </div>
                                <div className="text-xl font-bold text-white truncate">
                                    {formatUsdcAmount(totalRevenue)}
                                </div>
                                <div className="text-[10px] text-neutral-500 mt-0.5">USDC settled</div>
                            </div>
                        </div>
                    )}

                    {/* Sellers Leaderboard Data Table */}
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <p className="text-neutral-400 font-mono text-sm text-center">
                                Failed to load sellers: {error}
                            </p>
                            <button
                                type="button"
                                onClick={retry}
                                className="px-4 py-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-white font-mono text-xs rounded-lg transition-colors cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="border border-neutral-800 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-800">
                                <div className="h-9 w-full bg-neutral-900 rounded animate-pulse" />
                            </div>
                            <div className="divide-y divide-neutral-900">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                                        <div className="h-4 w-6 bg-neutral-800 rounded animate-pulse shrink-0" />
                                        <div className="h-8 w-8 bg-neutral-800 rounded-full animate-pulse shrink-0" />
                                        <div className="h-4 w-28 bg-neutral-800 rounded animate-pulse" />
                                        <div className="h-4 w-24 bg-neutral-800/60 rounded animate-pulse hidden md:block" />
                                        <div className="flex-1" />
                                        <div className="h-4 w-10 bg-neutral-800 rounded animate-pulse" />
                                        <div className="h-4 w-10 bg-neutral-800 rounded animate-pulse" />
                                        <div className="h-4 w-16 bg-neutral-800 rounded animate-pulse" />
                                        <div className="h-4 w-16 bg-neutral-800/60 rounded animate-pulse hidden sm:block" />
                                        <div className="h-4 w-14 bg-neutral-800/60 rounded animate-pulse hidden lg:block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            data={sellers}
                            columns={columns}
                            rowKey={(s) => s.id}
                            searchPlaceholder="Discover creators & sellers by name, address, specialty..."
                            searchFilter={searchFilter}
                            defaultSortField="volume"
                            defaultSortDirection="desc"
                            loading={false}
                            loadingText="Loading sellers..."
                            emptyText="No sellers found."
                            itemLabel="sellers"
                            onRowClick={(s) => router.push(`/sellers/${s.address}`)}
                        />
                    )}
                </main>
            </div>
        </TooltipProvider>
    );
}
