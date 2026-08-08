"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { blo } from "blo";
import {
    Copy,
    Check,
    Loader2,
    DollarSign,
    Unlock,
    ArrowUpRight,
    Tag,
    Receipt,
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
import { shortenHash, formatUsdcAmount, isEvmAddress, parseAmount, formatRelativeTime } from "@/lib/utils";
import { usePayers } from "@/hooks/use-payers";
import { usePaymentEvents, DEFAULT_SELLER_ADDRESS } from "@/hooks/use-transactions";
import { CATEGORY_DISPLAY_MAP, getAllAssets } from "@/lib/assets-data";
import { CopyableCell } from "@/components/copyable-cell";

const EXPLORER_BASE = "https://testnet.arcscan.app";

export default function PayerProfilePage() {
    const params = useParams();
    const rawAddress = (params?.address as string) || "";
    const [copiedHeader, setCopiedHeader] = useState(false);

    const isValid = isEvmAddress(rawAddress);
    if (!isValid) {
        notFound();
    }

    const normalizedAddress = rawAddress.toLowerCase();
    const formattedAddress = (rawAddress.startsWith("0x") ? rawAddress : `0x${rawAddress}`) as `0x${string}`;

    const { payers, loading: loadingPayers } = usePayers();
    const { events: paymentEvents, loading: loadingEvents } = usePaymentEvents();

    const currentPayer = useMemo(() => {
        return payers.find((p) => p.address.toLowerCase() === normalizedAddress);
    }, [payers, normalizedAddress]);

    const payerTransactions = useMemo(() => {
        if (!paymentEvents) return [];
        return paymentEvents
            .filter((ev) => ev.payer && ev.payer.toLowerCase() === normalizedAddress)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [paymentEvents, normalizedAddress]);

    const preferredCategories = useMemo(() => {
        if (currentPayer && currentPayer.buys.length > 0) {
            return currentPayer.buys;
        }
        const set = new Set<string>();
        const allAssets = getAllAssets();
        payerTransactions.forEach((ev) => {
            const match = allAssets.find((a) => a.endpoint.toLowerCase() === (ev.endpoint || "").toLowerCase());
            if (match) {
                set.add(CATEGORY_DISPLAY_MAP[match.category] || match.category);
            }
        });
        return Array.from(set);
    }, [currentPayer, payerTransactions]);

    const totalSpendNum = useMemo(() => {
        if (currentPayer) return currentPayer.raw_total_spend;
        return payerTransactions.reduce((acc, ev) => acc + parseAmount(ev.amount_usdc), 0);
    }, [currentPayer, payerTransactions]);

    const paymentsCount = useMemo(() => {
        if (currentPayer) return currentPayer.payments;
        return payerTransactions.length;
    }, [currentPayer, payerTransactions]);

    const uniqueAssetsCount = useMemo(() => {
        if (currentPayer) return currentPayer.unique_assets;
        const set = new Set<string>();
        payerTransactions.forEach((ev) => {
            if (ev.asset_name || ev.endpoint) set.add(ev.asset_name || ev.endpoint);
        });
        return set.size;
    }, [currentPayer, payerTransactions]);

    const avgPaymentNum = useMemo(() => {
        if (paymentsCount > 0) return totalSpendNum / paymentsCount;
        return 0;
    }, [totalSpendNum, paymentsCount]);

    const lastActiveTime = useMemo(() => {
        if (payerTransactions.length > 0) {
            return formatRelativeTime(payerTransactions[0].created_at);
        }
        if (currentPayer) {
            return formatRelativeTime(currentPayer.last_active);
        }
        return "recently";
    }, [payerTransactions, currentPayer]);

    const handleHeaderCopy = useCallback(() => {
        navigator.clipboard.writeText(formattedAddress);
        setCopiedHeader(true);
        setTimeout(() => setCopiedHeader(false), 2000);
    }, [formattedAddress]);

    const isLoading = loadingPayers || loadingEvents;

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-black text-white flex flex-col selection:bg-neutral-800 selection:text-white">
                <main className="flex-1 py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    {/* BREADCRUMB */}
                    <nav className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
                        <Link href="/agents" className="hover:text-white transition-colors">
                            Agents
                        </Link>
                        <span className="text-neutral-600">/</span>
                        <span className="text-neutral-200">{shortenHash(formattedAddress)}</span>
                    </nav>

                    {/* PAYER IDENTITY HEADER */}
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
                                        <span>Payer Wallet</span>
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

                    {/* PAYER METRICS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 font-mono">
                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Asset Unlocks</span>
                                <Unlock size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {uniqueAssetsCount}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">Distinct assets accessed</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Payments</span>
                                <Receipt size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {paymentsCount}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">Total settled x402 payments</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Total Spend</span>
                                <DollarSign size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white truncate">
                                {formatUsdcAmount(totalSpendNum)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">USDC settled</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Avg. Payment</span>
                                <Tag size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold text-white truncate">
                                {formatUsdcAmount(avgPaymentNum)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">Average payment per access</div>
                        </div>
                    </div>

                    {/* PREFERRED CATEGORIES (BUYS) */}
                    {preferredCategories.length > 0 && (
                        <div className="mb-8 bg-neutral-900/30 border border-neutral-800/60 rounded-lg p-4">
                            <h2 className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-3">
                                BUYS
                            </h2>
                            <div className="flex flex-wrap gap-2 items-center">
                                {preferredCategories.map((cat, i) => (
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

                    {/* RECENT TRANSACTIONS TABLE */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-mono font-medium tracking-wider text-white uppercase">
                                Payment History
                            </h2>
                            <span className="text-xs font-mono text-neutral-500">
                                {payerTransactions.length} payments
                            </span>
                        </div>

                        <Table>
                            <TableHeader className="border-b border-neutral-800/80">
                                <TableRow className="border-b border-neutral-800/80 hover:bg-transparent">
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                        TRANSACTION HASH
                                    </TableHead>
                                    <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                        SELLER
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
                                {isLoading ? (
                                    <TableRow className="hover:bg-transparent border-b-0">
                                        <TableCell colSpan={5} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                            <Loader2 size={16} className="animate-spin inline mr-2" />
                                            Loading payment history...
                                        </TableCell>
                                    </TableRow>
                                ) : payerTransactions.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-b-0">
                                        <TableCell colSpan={5} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                            No payment transactions recorded for this wallet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payerTransactions.map((ev) => {
                                        const sellerAddr = ev.seller || ev.seller_address || ev.merchant_address || DEFAULT_SELLER_ADDRESS;
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

                                                {/* SELLER */}
                                                <TableCell className="px-3 py-3 font-mono text-xs">
                                                    <CopyableCell
                                                        value={sellerAddr}
                                                        label={shortenHash(sellerAddr)}
                                                        href={`/sellers/${sellerAddr}`}
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
                                href={`/transactions?payer=${formattedAddress}`}
                                className="text-xs font-mono text-[#97E600] hover:underline flex items-center gap-1 transition-colors"
                            >
                                <span>View all transactions</span>
                                <ArrowUpRight size={13} />
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    );
}
