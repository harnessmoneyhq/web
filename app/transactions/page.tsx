"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Copy,
    Loader2,
    Plus,
    Activity,
    DollarSign,
    Users,
    Wallet,
    Store,
    Receipt,
    Zap,
    Lock,
} from "lucide-react";
import { shortenHash } from "@/lib/utils";
import { usePaymentEvents, PaymentEvent, DEFAULT_SELLER_ADDRESS } from "@/hooks/use-transactions";

type SortDirection = "asc" | "desc";
type SortField = "name" | "amount" | "date" | null;

const EXPLORER_BASE = "https://testnet.arcscan.app";

function parseAmount(amount: string): number {
    return parseFloat(amount.replace(/,/g, "")) || 0;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

function CopyableCell({
    value,
    label,
    href,
}: {
    value: string;
    label?: string;
    href?: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [value]);

    return (
        <span className="inline-flex items-center gap-1.5">
            {href ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-[#97E600] text-white transition-colors font-mono"
                >
                    {label ?? value}
                </a>
            ) : (
                <span className="font-mono text-white">{label ?? value}</span>
            )}
            <Tooltip open={copied || undefined}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="text-neutral-600 hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                        <Copy size={12} />
                    </button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 text-white border border-neutral-800 font-mono text-xs">
                    {copied ? "Copied!" : "Copy"}
                </TooltipContent>
            </Tooltip>
        </span>
    );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function TransactionsPage() {
    const { events: fetchedEvents, loading } = usePaymentEvents();
    const [simulatedEvents, setSimulatedEvents] = useState<PaymentEvent[]>([]);
    const [filter, setFilter] = useState("");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [secondsAgo, setSecondsAgo] = useState(0);
    const lastUpdatedRef = useRef<number>(Date.now());

    // Merge fetched events with user-simulated events
    const allEvents = useMemo(() => {
        const combined = [...simulatedEvents, ...fetchedEvents];
        const seen = new Set<string>();
        return combined.filter((ev) => {
            if (seen.has(ev.id)) return false;
            seen.add(ev.id);
            return true;
        });
    }, [fetchedEvents, simulatedEvents]);

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

    const handleSimulatePayment = useCallback(() => {
        const randomItems = [
            { endpoint: "/api/v1/market-data", asset_name: "USDC/USDT Orderbook Trace" },
            { endpoint: "/api/v1/agent-query", asset_name: "128K Context Window Pack" },
            { endpoint: "/api/v1/ai-summary", asset_name: "DocSummarizer History" },
            { endpoint: "/api/v1/sentiment", asset_name: "Crypto Sentiment Matrix" },
            { endpoint: "/api/v1/price-oracle", asset_name: "BTC/USD Chainlink Feed" },
        ];
        const randomPayers = [
            "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            "0x2546BcD3D8E287784651319A9E23B3310b457c45",
            "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
        ];
        const randomSellers = [
            DEFAULT_SELLER_ADDRESS,
            "0x15d34AA54267DB7D7c367839AAf71A00a2C6A65E",
            "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        ];
        const randomAmounts = ["0.001", "0.0025", "0.005", "0.010", "0.015", "0.020"];
        const randomHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        const selectedItem = randomItems[Math.floor(Math.random() * randomItems.length)];

        const newEvent: PaymentEvent = {
            id: `sim-${Date.now()}`,
            created_at: new Date().toISOString(),
            endpoint: selectedItem.endpoint,
            asset_name: selectedItem.asset_name,
            payer: randomPayers[Math.floor(Math.random() * randomPayers.length)],
            seller: randomSellers[Math.floor(Math.random() * randomSellers.length)],
            amount_usdc: randomAmounts[Math.floor(Math.random() * randomAmounts.length)],
            network: "Arc Testnet",
            gateway_tx: randomHash,
            raw: { simulated: true, latency_ms: Math.floor(Math.random() * 100) + 20 },
        };

        setSimulatedEvents((prev) => [newEvent, ...prev]);
    }, []);

    const handleSort = (field: NonNullable<SortField>) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection(field === "amount" ? "desc" : "asc");
        }
        setCurrentPage(1);
    };

    const renderSortIndicator = (field: NonNullable<SortField>) => {
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

    // ── Payments filtering & sorting ──
    const filteredPayments = useMemo(() => {
        let result = allEvents;

        if (filter) {
            const query = filter.toLowerCase();
            result = result.filter((ev) => {
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
            });
        }

        if (sortField) {
            result = [...result].sort((a, b) => {
                let aVal: number | string = 0;
                let bVal: number | string = 0;

                if (sortField === "amount") {
                    aVal = parseAmount(a.amount_usdc);
                    bVal = parseAmount(b.amount_usdc);
                } else if (sortField === "date") {
                    aVal = a.created_at;
                    bVal = b.created_at;
                }

                if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [allEvents, filter, sortField, sortDirection]);

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

    const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
    const clampedPage = Math.min(currentPage, totalPages);

    const paginatedPayments = useMemo(() => {
        const start = (clampedPage - 1) * pageSize;
        return filteredPayments.slice(start, start + pageSize);
    }, [filteredPayments, clampedPage, pageSize]);

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
                        <button
                            type="button"
                            onClick={handleSimulatePayment}
                            className="px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer bg-[#97E600]/15 text-[#97E600] border-[#97E600]/50 shadow-[0_0_12px_rgba(151,230,0,0.15)] hover:bg-[#97E600]/25 flex items-center gap-1.5 self-start sm:self-auto"
                        >
                            <Plus size={14} />
                            Simulate Payment
                        </button>
                    </div>

                    {/* Overview Stat Cards Grid (6 Metrics) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 font-mono">
                        <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg">
                            <div className="text-neutral-500 text-[11px] font-medium uppercase mb-1 flex items-center justify-between">
                                <span>Total Settled</span>
                                <DollarSign size={14} className="text-[#97E600]" />
                            </div>
                            <div className="text-lg font-bold text-white truncate">
                                ${totalVolume.toFixed(4)}
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
                                ${avgPaymentUsdc.toFixed(4)}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">USDC / Tx</div>
                        </div>
                    </div>

                    {/* Search & Page Size Toolbar */}
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
                            type="text"
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Discover transactions by asset name, endpoint, hash, payer, seller..."
                            className="w-full font-mono text-sm py-3 pl-9 pr-28 bg-neutral-900/60 border-b border-neutral-800 focus:border-[#97E600]/50 focus:outline-none text-white placeholder-neutral-500 transition-colors"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                            <span className="text-xs text-neutral-500 font-mono hidden sm:inline">Rows</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => {
                                    setPageSize(Number(v));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger size="sm" className="h-7 w-[65px] bg-neutral-900 border-neutral-800 text-white font-mono text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white font-mono text-xs">
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <SelectItem key={size} value={String(size)} className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table Component */}
                    <Table>
                        <TableHeader className="border-b border-neutral-800/80">
                            <TableRow className="border-b border-neutral-800/80 hover:bg-transparent">
                                <TableHead className="w-12 text-neutral-500 font-mono font-medium text-xs uppercase px-3 py-3">
                                    #
                                </TableHead>
                                <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                    Transaction ID
                                </TableHead>
                                <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                    Status
                                </TableHead>
                                <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                    Payer
                                </TableHead>
                                <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                    Seller
                                </TableHead>
                                <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3">
                                    Asset / Endpoint
                                </TableHead>
                                <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleSort("amount")}
                                        className="flex items-center justify-end w-full hover:text-white transition-colors group/btn"
                                    >
                                        Amount (USDC) {renderSortIndicator("amount")}
                                    </button>
                                </TableHead>
                                <TableHead className="font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleSort("date")}
                                        className="flex items-center justify-end w-full hover:text-white transition-colors group/btn"
                                    >
                                        Settled At {renderSortIndicator("date")}
                                    </button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-neutral-900">
                            {loading ? (
                                <TableRow className="hover:bg-transparent border-b-0">
                                    <TableCell colSpan={8} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                        <Loader2 size={16} className="animate-spin inline mr-2" />
                                        Loading payments...
                                    </TableCell>
                                </TableRow>
                            ) : paginatedPayments.length === 0 ? (
                                <TableRow className="hover:bg-transparent border-b-0">
                                    <TableCell colSpan={8} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                        No transactions matching &quot;{filter}&quot;
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPayments.map((ev, index) => {
                                    const sellerAddr = ev.seller || ev.seller_address || ev.merchant_address || DEFAULT_SELLER_ADDRESS;
                                    const fallbackName = ev.endpoint.split("/").pop() || "Unlocked Asset";
                                    const displayName = ev.asset_name || fallbackName;
                                    const statusVal = (ev.status || "settled").toLowerCase();

                                    return (
                                        <TableRow
                                            key={ev.id}
                                            className="border-b border-neutral-900 hover:bg-neutral-900/60 transition-colors group cursor-pointer"
                                        >
                                            {/* Sequential Rank Index */}
                                            <TableCell className="font-mono text-xs text-neutral-500 px-3 py-3">
                                                {(clampedPage - 1) * pageSize + index + 1}
                                            </TableCell>

                                            {/* Transaction Hash */}
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

                                            {/* Status Badge */}
                                            <TableCell className="px-3 py-3 font-mono text-xs">
                                                {statusVal === "pending" ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                        Pending
                                                    </span>
                                                ) : statusVal === "failed" ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-[#97E600]/10 text-[#97E600] border border-[#97E600]/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#97E600]" />
                                                        Settled
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Payer Address */}
                                            <TableCell className="px-3 py-3 font-mono text-xs">
                                                <CopyableCell
                                                    value={ev.payer}
                                                    label={shortenHash(ev.payer)}
                                                    href={`${EXPLORER_BASE}/address/${ev.payer}`}
                                                />
                                            </TableCell>

                                            {/* Seller Address */}
                                            <TableCell className="px-3 py-3 font-mono text-xs">
                                                <CopyableCell
                                                    value={sellerAddr}
                                                    label={shortenHash(sellerAddr)}
                                                    href={`${EXPLORER_BASE}/address/${sellerAddr}`}
                                                />
                                            </TableCell>

                                            {/* Unlocked Asset & Endpoint */}
                                            <TableCell className="px-3 py-3 min-w-0">
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
                                            </TableCell>

                                            {/* Amount (USDC) */}
                                            <TableCell className="px-3 py-3 text-right font-mono text-xs font-medium text-[#97E600]">
                                                ${ev.amount_usdc}
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell className="px-3 py-3 text-right font-mono text-xs text-neutral-400 whitespace-nowrap">
                                                {formatDate(ev.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls matching Home Leaderboard */}
                    {filteredPayments.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-900 font-mono text-xs text-neutral-400">
                            <div>
                                Showing <span className="text-white font-medium">{(clampedPage - 1) * pageSize + 1}</span>-
                                <span className="text-white font-medium">
                                    {Math.min(clampedPage * pageSize, filteredPayments.length)}
                                </span>{" "}
                                of <span className="text-white font-medium">{filteredPayments.length}</span> transactions
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                                <button
                                    type="button"
                                    disabled={clampedPage === 1}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    Previous
                                </button>

                                {getPageNumbers(clampedPage, totalPages).map((pageNum, idx) => {
                                    if (pageNum === "...") {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-neutral-600 select-none">
                                                ...
                                            </span>
                                        );
                                    }
                                    const isCurrent = clampedPage === pageNum;
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => setCurrentPage(Number(pageNum))}
                                            className={`px-3 py-1.5 rounded transition-all cursor-pointer font-medium ${isCurrent
                                                    ? "bg-[#97E600]/15 text-[#97E600] border border-[#97E600]/40 shadow-[0_0_8px_rgba(151,230,0,0.15)]"
                                                    : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    disabled={clampedPage === totalPages}
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </TooltipProvider>
    );
}
