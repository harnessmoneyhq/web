"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    TooltipProvider,
} from "@/components/ui/tooltip";
import {
    Users,
    Activity,
    Unlock,
    DollarSign,
} from "lucide-react";
import { shortenHash, formatUsdcAmount, formatCount, formatRelativeTime } from "@/lib/utils";
import { usePayers, Payer } from "@/hooks/use-payers";
import { CopyableCell } from "@/components/copyable-cell";
import { Identicon } from "@/components/identicon";
import { DataTable, ColumnDef } from "@/components/data-table";

export default function AgentsPage() {
    const router = useRouter();
    const { payers, loading, events } = usePayers();

    // ── Metrics computation ──
    const totalPayers = payers.length;

    const activePayers30D = useMemo(() => {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return payers.filter((p) => {
            const time = new Date(p.last_active).getTime();
            return !isNaN(time) && time >= thirtyDaysAgo;
        }).length;
    }, [payers]);

    const totalAssetsUnlocked = useMemo(() => {
        return events ? events.length : 0;
    }, [events]);

    const totalSpendAll = useMemo(() => {
        return payers.reduce((acc, p) => acc + p.raw_total_spend, 0);
    }, [payers]);

    const searchFilter = useCallback((p: Payer, query: string) => {
        if (p.address.toLowerCase().includes(query)) return true;
        if (shortenHash(p.address).toLowerCase().includes(query)) return true;

        const payerEvents = events.filter(
            (ev) => ev.payer.toLowerCase() === p.address.toLowerCase()
        );
        return payerEvents.some((ev) => {
            const assetMatch = ev.asset_name?.toLowerCase().includes(query);
            const endpointMatch = ev.endpoint?.toLowerCase().includes(query);
            const sellerMatch =
                ev.seller?.toLowerCase().includes(query) ||
                ev.seller_address?.toLowerCase().includes(query) ||
                ev.merchant_address?.toLowerCase().includes(query);
            return assetMatch || endpointMatch || sellerMatch;
        });
    }, [events]);

    const columns = useMemo<ColumnDef<Payer>[]>(() => [
        {
            id: "rank",
            header: "#",
            className: "w-10 text-neutral-500",
            cell: (_, __, globalIndex) => String(globalIndex + 1).padStart(2, "0"),
        },
        {
            id: "address",
            header: "PAYER",
            sortable: true,
            defaultSortDirection: "asc",
            getValue: (p) => p.address.toLowerCase(),
            cell: (payer) => (
                <div className="flex items-center gap-2.5 min-w-0">
                    <Identicon address={payer.address} />
                    <CopyableCell
                        value={payer.address}
                        label={shortenHash(payer.address)}
                        href={`/agents/${payer.address}`}
                    />
                </div>
            ),
        },
        {
            id: "buys",
            header: "BUYS",
            className: "hidden md:table-cell text-neutral-400",
            cell: (payer) => (payer.buys.length > 0 ? payer.buys.join(" · ") : "—"),
        },
        {
            id: "assets",
            header: "ASSETS",
            sortable: true,
            align: "right",
            className: "hidden sm:table-cell text-white font-medium",
            getValue: (p) => p.unique_assets,
            cell: (payer) => payer.unique_assets,
        },
        {
            id: "payments",
            header: "PAYMENTS",
            sortable: true,
            align: "right",
            className: "text-white font-medium",
            getValue: (p) => p.payments,
            cell: (payer) => payer.payments,
        },
        {
            id: "total_spend",
            header: "TOTAL SPEND (USDC)",
            sortable: true,
            align: "right",
            className: "font-medium text-[#97E600]",
            getValue: (p) => p.raw_total_spend,
            cell: (payer) => formatUsdcAmount(payer.raw_total_spend),
        },
        {
            id: "avg_payment",
            header: "AVG. PAYMENT (USDC)",
            sortable: true,
            align: "right",
            className: "hidden sm:table-cell text-neutral-400",
            getValue: (p) => p.raw_avg_payment,
            cell: (payer) => formatUsdcAmount(payer.raw_avg_payment),
        },
        {
            id: "last_active",
            header: "LAST ACTIVE",
            sortable: true,
            align: "right",
            className: "hidden lg:table-cell text-neutral-400",
            getValue: (p) => new Date(p.last_active).getTime(),
            cell: (payer) => formatRelativeTime(payer.last_active),
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
                                AGENTS
                            </h1>
                            <p className="text-neutral-400 font-mono text-xs">
                                Discover payer wallets consuming AI assets through x402.
                            </p>
                        </div>
                    </div>

                    {/* Overview Metric Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-mono">
                        {/* 1. TOTAL PAYERS */}
                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>TOTAL PAYERS</span>
                                <Users size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-xl font-bold text-white">
                                {totalPayers}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                                All-time unique wallets
                            </div>
                        </div>

                        {/* 2. ACTIVE PAYERS · 30D */}
                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>ACTIVE PAYERS · 30D</span>
                                <Activity size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-xl font-bold text-white">
                                {activePayers30D}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                                Paid within the last 30 days
                            </div>
                        </div>

                        {/* 3. ASSET UNLOCKS */}
                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>ASSET UNLOCKS</span>
                                <Unlock size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-xl font-bold text-white">
                                {formatCount(totalAssetsUnlocked)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                                Successful paid accesses
                            </div>
                        </div>

                        {/* 4. TOTAL SPEND */}
                        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-lg">
                            <div className="text-neutral-500 text-xs font-medium uppercase mb-1 flex items-center justify-between">
                                <span>TOTAL SPEND</span>
                                <DollarSign size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-xl font-bold text-white truncate">
                                {formatUsdcAmount(totalSpendAll)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                                USDC settled
                            </div>
                        </div>
                    </div>

                    {/* Payers Leaderboard Data Table */}
                    <DataTable
                        data={payers}
                        columns={columns}
                        rowKey={(p) => p.id}
                        searchPlaceholder="Search by payer wallet, asset, endpoint, or seller..."
                        searchFilter={searchFilter}
                        defaultSortField="total_spend"
                        defaultSortDirection="desc"
                        loading={loading}
                        loadingText="Loading payer activity..."
                        emptyText="No payer activity yet."
                        itemLabel="payers"
                        onRowClick={(p) => router.push(`/agents/${p.address}`)}
                    />
                </main>
            </div>
        </TooltipProvider>
    );
}
