"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    TooltipProvider,
} from "@/components/ui/tooltip";
import {
    Loader2,
    Activity,
    DollarSign,
    Store,
    Receipt,
    Zap,
    Wallet,
} from "lucide-react";
import { shortenHash, formatUsdcAmount, parseAmount, formatDate } from "@/lib/utils";
import { usePaymentEvents, PaymentEvent, DEFAULT_SELLER_ADDRESS } from "@/hooks/use-transactions";
import { CopyableCell } from "@/components/copyable-cell";
import { DataTable, ColumnDef } from "@/components/data-table";

const EXPLORER_BASE = "https://testnet.arcscan.app";

function TransactionsContent() {
    const searchParams = useSearchParams();

    const [secondsAgo, setSecondsAgo] = useState(0);
    const lastUpdatedRef = useRef<number>(Date.now());

    const initialSearchQuery = useMemo(() => {
        const sellerParam = searchParams.get("seller");
        const payerParam = searchParams.get("payer");
        const queryParam = searchParams.get("q") || searchParams.get("search");
        return payerParam || sellerParam || queryParam || "";
    }, [searchParams]);

    const { events: fetchedEvents, loading } = usePaymentEvents();
    const allEvents = fetchedEvents;

    useEffect(() => {
        if (allEvents.length > 0) {
            lastUpdatedRef.current = Date.now();
            setSecondsAgo(0);
        }
    }, [allEvents]);

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - lastUpdatedRef.current) / 1000);
            setSecondsAgo(diff);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const totalVolume = useMemo(() => {
        return allEvents.reduce((acc, ev) => acc + parseAmount(ev.amount_usdc), 0);
    }, [allEvents]);

    const activeEndpointsCount = useMemo(() => {
        return new Set(allEvents.map((ev) => ev.endpoint)).size;
    }, [allEvents]);

    const activePayersCount = useMemo(() => {
        return new Set(allEvents.map((ev) => ev.payer.toLowerCase())).size;
    }, [allEvents]);

    const activeSellersCount = useMemo(() => {
        return new Set(
            allEvents.map((ev) =>
                (ev.seller || ev.seller_address || ev.merchant_address || DEFAULT_SELLER_ADDRESS).toLowerCase()
            )
        ).size;
    }, [allEvents]);

    const avgPaymentUsdc = useMemo(() => {
        if (allEvents.length === 0) return 0;
        return totalVolume / allEvents.length;
    }, [allEvents, totalVolume]);

    const searchFilter = useCallback((ev: PaymentEvent, query: string) => {
        const sellerAddr = (ev.seller || ev.seller_address || ev.merchant_address || DEFAULT_SELLER_ADDRESS).toLowerCase();
        const assetName = (ev.asset_name || "").toLowerCase();
        return (
            (ev.gateway_tx ?? "").toLowerCase().includes(query) ||
            ev.payer.toLowerCase().includes(query) ||
            sellerAddr.includes(query) ||
            ev.endpoint.toLowerCase().includes(query) ||
            assetName.includes(query) ||
            ev.network.toLowerCase().includes(query) ||
            (ev.status || "settled").toLowerCase().includes(query)
        );
    }, []);

    const columns = useMemo<ColumnDef<PaymentEvent>[]>(() => [
        {
            id: "rank",
            header: "#",
            className: "w-12 text-neutral-500",
            cell: (_, __, globalIndex) => globalIndex + 1,
        },
        {
            id: "tx",
            header: "Transaction Hash",
            cell: (ev) => (
                ev.gateway_tx ? (
                    <CopyableCell
                        variant="bright"
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
                )
            ),
        },
        {
            id: "status",
            header: "Status",
            cell: (ev) => {
                const statusVal = (ev.status || "settled").toLowerCase();
                if (statusVal === "pending") {
                    return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending
                        </span>
                    );
                }
                if (statusVal === "failed") {
                    return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Failed
                        </span>
                    );
                }
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-[#97E600]/10 text-[#97E600] border border-[#97E600]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#97E600]" />
                        Settled
                    </span>
                );
            },
        },
        {
            id: "payer",
            header: "Payer",
            cell: (ev) => (
                <CopyableCell
                    variant="bright"
                    value={ev.payer}
                    label={shortenHash(ev.payer)}
                    href={`${EXPLORER_BASE}/address/${ev.payer}`}
                />
            ),
        },
        {
            id: "seller",
            header: "Seller",
            cell: (ev) => {
                const sellerAddr = ev.seller || ev.seller_address || ev.merchant_address || DEFAULT_SELLER_ADDRESS;
                return (
                    <CopyableCell
                        variant="bright"
                        value={sellerAddr}
                        label={shortenHash(sellerAddr)}
                        href={`/sellers/${sellerAddr}`}
                    />
                );
            },
        },
        {
            id: "asset",
            header: "Asset / Endpoint",
            className: "min-w-0",
            cell: (ev) => {
                const fallbackName = ev.endpoint.split("/").pop() || "Unlocked Asset";
                const displayName = ev.asset_name || fallbackName;
                return (
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-white group-hover:text-[#97E600] transition-colors text-xs truncate">
                                {displayName}
                            </span>
                        </div>
                        <div className="mt-0.5">
                            <code className="text-[10px] text-neutral-400 font-mono bg-neutral-900/90 border border-neutral-800/80 px-1.5 py-0.2 rounded">
                                {ev.endpoint}
                            </code>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "amount",
            header: "AMOUNT (USDC)",
            sortable: true,
            align: "right",
            className: "font-medium text-[#97E600]",
            getValue: (ev) => parseAmount(ev.amount_usdc),
            cell: (ev) => formatUsdcAmount(ev.amount_usdc),
        },
        {
            id: "date",
            header: "SETTLED AT",
            sortable: true,
            align: "right",
            className: "text-neutral-400 whitespace-nowrap",
            getValue: (ev) => new Date(ev.created_at).getTime(),
            cell: (ev) => formatDate(ev.created_at),
        },
    ], []);

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-black text-white flex flex-col selection:bg-neutral-800 selection:text-white">
                <main className="flex-1 py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-sm font-mono font-medium tracking-wider text-white uppercase">
                                    Transactions
                                </h1>
                                <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-2 py-0.5 rounded-full text-[10px] font-mono">
                                    <span className="flex items-center gap-1 text-[#97E600] font-medium tracking-wider uppercase">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#97E600] animate-pulse shadow-[0_0_6px_#97E600]" />
                                        LIVE
                                    </span>
                                    <span className="text-neutral-600">•</span>
                                    <span className="text-neutral-400">
                                        Updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
                                    </span>
                                </div>
                            </div>
                            <p className="text-neutral-400 font-mono text-xs">
                                Monitor x402 payments and asset unlocks settled through Circle Gateway.
                            </p>
                        </div>
                    </div>

                    {/* Overview Stat Cards Grid (6 Metrics) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 font-mono">
                        <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg">
                            <div className="text-neutral-500 text-[11px] font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Total Settled</span>
                                <DollarSign size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-lg font-bold text-white truncate">
                                {formatUsdcAmount(totalVolume)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">USDC Settled</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg">
                            <div className="text-neutral-500 text-[11px] font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Transactions</span>
                                <Activity size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-lg font-bold text-white">
                                {allEvents.length}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">Total Purchases</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg">
                            <div className="text-neutral-500 text-[11px] font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Unique Assets</span>
                                <Zap size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-lg font-bold text-white">
                                {activeEndpointsCount}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">Purchased Assets</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg">
                            <div className="text-neutral-500 text-[11px] font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Unique Payers</span>
                                <Wallet size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-lg font-bold text-white">
                                {activePayersCount}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">Unique Buyers</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg">
                            <div className="text-neutral-500 text-[11px] font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Unique Sellers</span>
                                <Store size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-lg font-bold text-white">
                                {activeSellersCount}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">Unique Providers</div>
                        </div>

                        <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg">
                            <div className="text-neutral-500 text-[11px] font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Avg. Transaction</span>
                                <Receipt size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-lg font-bold text-white truncate">
                                {formatUsdcAmount(avgPaymentUsdc)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">USDC / Tx</div>
                        </div>
                    </div>

                    {/* Data Table Component */}
                    <DataTable
                        data={allEvents}
                        columns={columns}
                        rowKey={(ev) => ev.id}
                        initialSearchQuery={initialSearchQuery}
                        searchPlaceholder="Discover transactions by asset name, endpoint, hash, payer, seller..."
                        searchFilter={searchFilter}
                        loading={loading}
                        loadingText="Loading payments..."
                        emptyText="No transactions yet."
                        itemLabel="transactions"
                    />
                </main>
            </div>
        </TooltipProvider>
    );
}

export default function TransactionsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-black text-neutral-400 font-mono text-sm flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading transactions...
                </div>
            }
        >
            <TransactionsContent />
        </Suspense>
    );
}
