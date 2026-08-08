"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { blo } from "blo";
import {
    Copy,
    Check,
    DollarSign,
    Unlock,
    Package,
    ArrowUpRight,
    Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    TooltipProvider,
} from "@/components/ui/tooltip";
import { shortenHash, formatUsdcAmount, isEvmAddress, parseAmount, parseDownloads, formatCount, formatRelativeTime } from "@/lib/utils";
import { useSellers } from "@/hooks/use-sellers";
import { usePaymentEvents } from "@/hooks/use-transactions";
import { CATEGORY_DISPLAY_MAP } from "@/lib/assets-data";
import type { AssetItem } from "@/lib/assets-data";
import { createClient } from "@/lib/supabase/client";
import { CopyableCell } from "@/components/copyable-cell";

const EXPLORER_BASE = "https://testnet.arcscan.app";

function formatSellerSince(isoOrDefault: string): string {
    if (!isoOrDefault) return "May 2026";
    const d = new Date(isoOrDefault);
    if (isNaN(d.getTime())) return "May 2026";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
}


export default function SellerProfilePage() {
    const params = useParams();
    const rawAddress = (params?.address as string) || "";
    const [copiedHeader, setCopiedHeader] = useState(false);

    // Validate EVM address format
    const isValid = isEvmAddress(rawAddress);
    if (!isValid) {
        notFound();
    }

    const normalizedAddress = rawAddress.toLowerCase();
    const formattedAddress = (rawAddress.startsWith("0x") ? rawAddress : `0x${rawAddress}`) as `0x${string}`;

    // Data hooks
    const { sellers, loading: loadingSellers, error: sellersError, retry: retrySellers } = useSellers();
    const { events: paymentEvents, loading: loadingEvents } = usePaymentEvents();

    // Seller metadata from useSellers hook if registered
    const registeredSeller = useMemo(() => {
        return sellers.find((s) => s.address.toLowerCase() === normalizedAddress);
    }, [sellers, normalizedAddress]);

    // Seller payment events (transactions)
    const sellerTransactions = useMemo(() => {
        if (!paymentEvents) return [];
        return paymentEvents
            .filter((ev) => {
                const sellerAddr = (ev.seller || ev.seller_address || ev.merchant_address || "").toLowerCase();
                return sellerAddr === normalizedAddress;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [paymentEvents, normalizedAddress]);

    const [listedAssets, setListedAssets] = useState<AssetItem[]>([]);

    useEffect(() => {
        if (!rawAddress) return;
        const supabase = createClient();
        supabase
            .from("assets")
            .select("*")
            .ilike("seller_address", rawAddress)
            .order("rank", { ascending: true })
            .then(({ data }) => {
                if (!data) { setListedAssets([]); return; }
                setListedAssets(
                    data.map((row: {
                        id: string; rank: number; name: string; category: string; model: string;
                        price: string; downloads: string; sparkline: number[]; official: boolean;
                        is_new: boolean; is_trending: boolean; is_hot: boolean; description: string;
                        endpoint: string; http_method: string; seller_address: string | null;
                        stats: { uptime?: string; latency?: string; successRate?: string; calls30d?: string } | null;
                    }) => ({
                        id: row.id,
                        rank: row.rank,
                        name: row.name,
                        category: row.category as AssetItem["category"],
                        model: row.model,
                        price: row.price,
                        downloads: row.downloads,
                        sparkline: row.sparkline || [],
                        official: row.official,
                        isNew: row.is_new,
                        isTrending: row.is_trending,
                        isHot: row.is_hot,
                        description: row.description || "",
                        endpoint: row.endpoint,
                        httpMethod: (row.http_method || "GET") as "GET" | "POST",
                        sellerAddress: row.seller_address || undefined,
                        stats: {
                            uptime: row.stats?.uptime ?? "99.9%",
                            latency: row.stats?.latency ?? "50ms",
                            successRate: row.stats?.successRate ?? "99.9%",
                            calls30d: row.stats?.calls30d ?? "0",
                        },
                        codeSnippets: {
                            curl: `curl -X ${row.http_method || "GET"} ${row.endpoint} -H "Authorization: Bearer $AGENT_USDC_KEY"`,
                            typescript: `const res = await fetch("${row.endpoint}");`,
                            python: `res = requests.${(row.http_method || "GET").toLowerCase()}("${row.endpoint}")`,
                        },
                    }))
                );
            });
    }, [rawAddress]);

    const assetCategories = useMemo(() => {
        if (registeredSeller && registeredSeller.specialties.length > 0) {
            return registeredSeller.specialties;
        }
        const counts = new Map<string, number>();
        listedAssets.forEach((asset) => {
            const cat = CATEGORY_DISPLAY_MAP[asset.category] || asset.category;
            counts.set(cat, (counts.get(cat) || 0) + 1);
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);
    }, [registeredSeller, listedAssets]);

    // Metrics calculations
    const listedAssetsCount = useMemo(() => {
        if (registeredSeller) {
            return Math.max(registeredSeller.assets_count, listedAssets.length);
        }
        return listedAssets.length;
    }, [registeredSeller, listedAssets]);

    const totalVolumeNum = useMemo(() => {
        const txVolume = sellerTransactions.reduce((acc, ev) => acc + parseAmount(ev.amount_usdc), 0);
        if (registeredSeller) {
            const baseVol = parseAmount(registeredSeller.total_revenue_usdc);
            return Math.max(baseVol, txVolume);
        }
        return txVolume;
    }, [sellerTransactions, registeredSeller]);

    const totalUnlocksCount = useMemo(() => {
        if (registeredSeller) {
            return Math.max(registeredSeller.total_sales, sellerTransactions.length);
        }
        return sellerTransactions.length;
    }, [sellerTransactions, registeredSeller]);

    const avgSaleNum = useMemo(() => {
        if (totalUnlocksCount > 0) {
            return totalVolumeNum / totalUnlocksCount;
        }
        if (registeredSeller && registeredSeller.avg_sale_usdc) {
            const parsedAvg = parseAmount(registeredSeller.avg_sale_usdc);
            if (parsedAvg > 0) return parsedAvg;
        }
        return 0;
    }, [registeredSeller, totalVolumeNum, totalUnlocksCount]);

    const lastActiveTime = useMemo(() => {
        if (sellerTransactions.length > 0) {
            return formatRelativeTime(sellerTransactions[0].created_at);
        }
        if (registeredSeller) {
            return registeredSeller.last_active;
        }
        return "recently";
    }, [sellerTransactions, registeredSeller]);

    const sellerSinceDate = useMemo(() => {
        if (sellerTransactions.length > 0) {
            const oldest = sellerTransactions[sellerTransactions.length - 1];
            return formatSellerSince(oldest.created_at);
        }
        return "May 2026";
    }, [sellerTransactions]);

    const handleHeaderCopy = useCallback(() => {
        navigator.clipboard.writeText(formattedAddress);
        setCopiedHeader(true);
        setTimeout(() => setCopiedHeader(false), 2000);
    }, [formattedAddress]);

    const isLoading = loadingSellers || loadingEvents;

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-black text-white flex flex-col selection:bg-neutral-800 selection:text-white">
                <main className="flex-1 py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    {/* 1. BREADCRUMB / BACK NAVIGATION */}
                    <nav className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
                        <Link
                            href="/sellers"
                            className="hover:text-white transition-colors"
                        >
                            Sellers
                        </Link>
                        <span className="text-neutral-600">/</span>
                        <span className="text-neutral-200">{shortenHash(formattedAddress)}</span>
                    </nav>

                    {/* ERROR STATE */}
                    {sellersError ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <p className="text-neutral-400 font-mono text-sm text-center">
                                Failed to load seller data: {sellersError}
                            </p>
                            <button
                                type="button"
                                onClick={retrySellers}
                                className="px-4 py-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-white font-mono text-xs rounded-lg transition-colors cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    ) : isLoading ? (
                        <>
                            {/* Skeleton: Identity Header */}
                            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-5 sm:p-6 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-neutral-800 animate-pulse shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="h-5 w-72 max-w-full bg-neutral-800 rounded animate-pulse" />
                                        <div className="h-3 w-48 bg-neutral-800/60 rounded animate-pulse mt-3" />
                                    </div>
                                </div>
                            </div>

                            {/* Skeleton: Metric Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 font-mono">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="h-3 w-20 bg-neutral-800 rounded animate-pulse" />
                                            <div className="h-3.5 w-3.5 bg-neutral-800 rounded animate-pulse" />
                                        </div>
                                        <div className="h-8 w-16 bg-neutral-800 rounded animate-pulse mt-2" />
                                        <div className="h-2.5 w-24 bg-neutral-800/60 rounded animate-pulse mt-2" />
                                    </div>
                                ))}
                            </div>

                            {/* Skeleton: Category Pills */}
                            <div className="mb-8 bg-neutral-900/30 border border-neutral-800/60 rounded-lg p-4">
                                <div className="h-3 w-12 bg-neutral-800 rounded animate-pulse mb-3" />
                                <div className="flex gap-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-7 w-20 bg-neutral-800 rounded-md animate-pulse" />
                                    ))}
                                </div>
                            </div>

                            {/* Skeleton: Listed Assets Table */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-4 w-28 bg-neutral-800 rounded animate-pulse" />
                                    <div className="h-3 w-24 bg-neutral-800/60 rounded animate-pulse" />
                                </div>
                                <div className="border border-neutral-800/80 rounded-lg overflow-hidden divide-y divide-neutral-900">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 px-3 py-3.5">
                                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                <div className="h-3.5 w-44 bg-neutral-800 rounded animate-pulse" />
                                                <div className="h-3 w-56 bg-neutral-800/40 rounded animate-pulse" />
                                            </div>
                                            <div className="h-5 w-16 bg-neutral-800 rounded animate-pulse" />
                                            <div className="h-3.5 w-12 bg-neutral-800 rounded animate-pulse" />
                                            <div className="h-3.5 w-10 bg-neutral-800 rounded animate-pulse hidden sm:block" />
                                            <div className="h-3.5 w-14 bg-neutral-800 rounded animate-pulse" />
                                            <div className="h-3.5 w-14 bg-neutral-800/60 rounded animate-pulse hidden md:block" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Skeleton: Recent Transactions Table */}
                            <div>
                                <div className="h-4 w-40 bg-neutral-800 rounded animate-pulse mb-4" />
                                <div className="border border-neutral-800/80 rounded-lg overflow-hidden divide-y divide-neutral-900">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 px-3 py-3.5">
                                            <div className="h-3.5 w-24 bg-neutral-800 rounded animate-pulse" />
                                            <div className="h-3.5 w-24 bg-neutral-800 rounded animate-pulse" />
                                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                <div className="h-3.5 w-36 bg-neutral-800 rounded animate-pulse" />
                                                <div className="h-3 w-48 bg-neutral-800/40 rounded animate-pulse" />
                                            </div>
                                            <div className="h-3.5 w-14 bg-neutral-800 rounded animate-pulse" />
                                            <div className="h-3.5 w-16 bg-neutral-800/60 rounded animate-pulse hidden sm:block" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                    <>
                    {/* 2. SELLER IDENTITY HEADER */}
                    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-5 sm:p-6 mb-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-4">
                                <Image
                                    src={blo(formattedAddress)}
                                    alt={formattedAddress}
                                    width={48}
                                    height={48}
                                    unoptimized
                                    className="w-12 h-12 rounded-full flex-shrink-0 border border-neutral-700/80 shadow-md object-cover select-none bg-neutral-800"
                                />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="font-mono text-base sm:text-xl font-bold tracking-tight text-white break-all">
                                            {formattedAddress}
                                        </h1>
                                        <button
                                            type="button"
                                            onClick={handleHeaderCopy}
                                            className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 px-2 py-1 rounded text-xs font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
                                            title="Copy full wallet address"
                                        >
                                            {copiedHeader ? (
                                                <>
                                                    <Check size={12} className="text-[#97E600]" />
                                                    <span className="text-[#97E600] font-medium">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={12} className="text-neutral-400" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-neutral-400 font-mono text-xs mt-1.5 flex items-center gap-2">
                                        <span>Seller since {sellerSinceDate}</span>
                                        <span className="text-neutral-600">•</span>
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#97E600] animate-pulse" />
                                            Last active {lastActiveTime}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. SELLER METRICS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 font-mono">
                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Listed Assets</span>
                                <Package size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {listedAssetsCount}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">Published marketplace assets</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Total Unlocks</span>
                                <Unlock size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatCount(totalUnlocksCount)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">Successful paid accesses</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Seller Volume</span>
                                <DollarSign size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white truncate">
                                {formatUsdcAmount(totalVolumeNum)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">Total settled revenue (USDC)</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Avg. Sale</span>
                                <Tag size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white truncate">
                                {formatUsdcAmount(avgSaleNum)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">Average payment received</div>
                        </div>
                    </div>

                    {/* 4. ASSET CATEGORIES (SELLS) */}
                    {assetCategories.length > 0 && (
                        <div className="mb-8 bg-neutral-900/30 border border-neutral-800/60 rounded-lg p-4">
                            <h2 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-3">
                                SELLS
                            </h2>
                            <div className="flex flex-wrap gap-2 items-center">
                                {assetCategories.map((cat, i) => (
                                    <Badge
                                        key={i}
                                        variant="outline"
                                        className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700 font-mono text-xs font-normal px-3 py-1 rounded-md transition-colors"
                                    >
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 5. LISTED ASSETS */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-mono font-medium tracking-wider text-white uppercase">
                                Listed Assets
                            </h2>
                            <span className="text-xs font-mono text-neutral-500">
                                {listedAssets.length} active listings
                            </span>
                        </div>

                        <Table>
                            <TableHeader className="border-b border-neutral-800/80">
                                <TableRow className="border-b border-neutral-800/80 hover:bg-transparent">
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                        ASSET
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                        TYPE
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right">
                                        PRICE
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right hidden sm:table-cell">
                                        UNLOCKS
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right">
                                        VOLUME (USDC)
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right hidden md:table-cell">
                                        LAST UPDATED
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-neutral-900">
                                {listedAssets.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-b-0">
                                        <TableCell colSpan={6} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                            No active listings published by this seller.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    listedAssets.map((asset) => {
                                        const categoryLabel = CATEGORY_DISPLAY_MAP[asset.category] || asset.category;

                                        // Match payment transactions for this specific asset/endpoint
                                        const txsForAsset = sellerTransactions.filter((ev) => {
                                            const epMatch = ev.endpoint && asset.endpoint && ev.endpoint.toLowerCase() === asset.endpoint.toLowerCase();
                                            const nameMatch = ev.asset_name && asset.name && ev.asset_name.toLowerCase() === asset.name.toLowerCase();
                                            return epMatch || nameMatch;
                                        });

                                        const staticUnlocks = parseDownloads(asset.downloads);
                                        const unlocksCount = txsForAsset.length > 0 ? Math.max(staticUnlocks, txsForAsset.length) : staticUnlocks;

                                        const priceNum = parseAmount(asset.price);
                                        const txVolume = txsForAsset.reduce((acc, ev) => acc + parseAmount(ev.amount_usdc), 0);
                                        const computedVolume = priceNum * unlocksCount;
                                        const finalVolumeNum = txsForAsset.length > 0 ? Math.max(txVolume, computedVolume) : computedVolume;

                                        const lastUpdated = txsForAsset.length > 0
                                            ? formatRelativeTime(txsForAsset[0].created_at)
                                            : "recently";

                                        return (
                                            <TableRow
                                                key={asset.id}
                                                className="border-b border-neutral-900 hover:bg-neutral-900/60 transition-colors group"
                                            >
                                                {/* ASSET NAME & ENDPOINT */}
                                                <TableCell className="px-3 py-3 min-w-0">
                                                    <div className="flex flex-col justify-center">
                                                        <Link
                                                            href={`/assets/${asset.id}`}
                                                            className="font-medium text-white group-hover:text-[#97E600] transition-colors text-xs hover:underline flex items-center gap-1.5 w-fit"
                                                        >
                                                            <span>{asset.name}</span>
                                                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#97E600]" />
                                                        </Link>
                                                        <div className="mt-1">
                                                            <code className="text-[10px] text-neutral-400 font-mono bg-neutral-900/90 border border-neutral-800/80 px-1.5 py-0.5 rounded">
                                                                {asset.endpoint}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* TYPE */}
                                                <TableCell className="px-3 py-3 font-mono text-xs">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-neutral-900/90 border-neutral-800 text-neutral-300 font-mono text-[10px] font-normal px-2 py-0.5 rounded whitespace-nowrap capitalize"
                                                    >
                                                        {categoryLabel}
                                                    </Badge>
                                                </TableCell>

                                                {/* PRICE */}
                                                <TableCell className="px-3 py-3 text-right font-mono text-xs text-neutral-400">
                                                    {asset.price}
                                                </TableCell>

                                                {/* UNLOCKS */}
                                                <TableCell className="px-3 py-3 text-right font-mono text-xs text-white font-medium hidden sm:table-cell">
                                                    {formatCount(unlocksCount)}
                                                </TableCell>

                                                {/* VOLUME (USDC) */}
                                                <TableCell className="px-3 py-3 text-right font-mono text-xs font-medium text-[#97E600]">
                                                    {formatUsdcAmount(finalVolumeNum)}
                                                </TableCell>

                                                {/* LAST UPDATED */}
                                                <TableCell className="px-3 py-3 text-right font-mono text-xs text-neutral-400 hidden md:table-cell">
                                                    {lastUpdated}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* 6. RECENT TRANSACTIONS */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-sm font-mono font-medium tracking-wider text-white uppercase">
                                Recent Transactions
                            </h2>
                        </div>

                        <Table>
                            <TableHeader className="border-b border-neutral-800/80">
                                <TableRow className="border-b border-neutral-800/80 hover:bg-transparent">
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                        TRANSACTION HASH
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                        PAYER
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                        ASSET / ENDPOINT
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right">
                                        AMOUNT (USDC)
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right hidden sm:table-cell">
                                        SETTLED AT
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-neutral-900">
                                {sellerTransactions.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-b-0">
                                        <TableCell colSpan={5} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                            No transaction history recorded for this seller.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sellerTransactions.map((ev) => {
                                        const fallbackName = ev.endpoint.split("/").pop() || "Market Access";
                                        const displayName = ev.asset_name || fallbackName;
                                        return (
                                            <TableRow
                                                key={ev.id}
                                                className="border-b border-neutral-900 hover:bg-neutral-900/60 transition-colors group"
                                            >
                                                {/* TRANSACTION HASH */}
                                                <TableCell className="px-3 py-3 font-mono text-xs">
                                                    {ev.gateway_tx ? (
                                                        <CopyableCell
                                                            value={ev.gateway_tx}
                                                            label={shortenHash(ev.gateway_tx, 6)}
                                                            href={
                                                                ev.gateway_tx.startsWith("0x")
                                                                    ? `${EXPLORER_BASE}/tx/${ev.gateway_tx}`
                                                                    : undefined
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-neutral-600">—</span>
                                                    )}
                                                </TableCell>

                                                {/* PAYER */}
                                                <TableCell className="px-3 py-3 font-mono text-xs">
                                                    <CopyableCell
                                                        value={ev.payer}
                                                        label={shortenHash(ev.payer)}
                                                        href={`/agents/${ev.payer}`}
                                                    />
                                                </TableCell>

                                                {/* ASSET / ENDPOINT */}
                                                <TableCell className="px-3 py-3 min-w-0">
                                                    <div className="flex flex-col justify-center">
                                                        <span className="font-medium text-white text-xs truncate">
                                                            {displayName}
                                                        </span>
                                                        <div className="mt-0.5">
                                                            <code className="text-[10px] text-neutral-400 font-mono bg-neutral-900/90 border border-neutral-800/80 px-1.5 py-0.5 rounded">
                                                                {ev.endpoint}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* AMOUNT (USDC) */}
                                                <TableCell className="px-3 py-3 text-right font-mono text-xs font-medium text-[#97E600]">
                                                    {formatUsdcAmount(ev.amount_usdc)}
                                                </TableCell>

                                                {/* SETTLED AT */}
                                                <TableCell className="px-3 py-3 text-right font-mono text-xs text-neutral-400 hidden sm:table-cell">
                                                    {formatRelativeTime(ev.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex justify-end">
                            <Link
                                href={`/transactions?seller=${formattedAddress}`}
                                className="text-xs font-mono text-[#97E600] hover:underline flex items-center gap-1 transition-colors"
                            >
                                <span>View all transactions</span>
                                <ArrowUpRight size={13} />
                            </Link>
                        </div>
                    </div>
                    </>
                    )}
                </main>
            </div>
        </TooltipProvider>
    );
}
