import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePaymentEvents } from "@/hooks/use-transactions";
import { CATEGORY_DISPLAY_MAP, getAllAssets } from "@/lib/assets-data";
import { parseAmount } from "@/lib/utils";

export type Payer = {
    id: string;
    address: string;
    buys: string[];
    unique_assets: number;
    payments: number;
    total_spend: string;
    raw_total_spend: number;
    avg_payment: string;
    raw_avg_payment: number;
    last_active: string;
};

export function usePayers() {
    const [dbPayers, setDbPayers] = useState<Payer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { events, loading: loadingEvents } = usePaymentEvents();

    const fetchPayers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data, error: dbError } = await supabase
                .from("payers")
                .select("*")
                .order("total_spend_usdc", { ascending: false });

            if (dbError) {
                throw new Error(dbError.message);
            }

            if (!data) {
                throw new Error("No data returned from payers table");
            }

            setDbPayers(
                data.map(
                    (row: {
                        id: string;
                        address: string;
                        buys: string[];
                        unique_assets: number;
                        payments: number;
                        total_spend_usdc: number;
                        avg_payment_usdc: number;
                        last_active: string;
                    }) => {
                        const totalSpend = Number(row.total_spend_usdc) || 0;
                        const avgPayment = Number(row.avg_payment_usdc) || 0;
                        return {
                            id: row.id,
                            address: row.address,
                            buys: row.buys || [],
                            unique_assets: row.unique_assets,
                            payments: row.payments,
                            total_spend: totalSpend.toFixed(4),
                            raw_total_spend: totalSpend,
                            avg_payment: avgPayment.toFixed(4),
                            raw_avg_payment: avgPayment,
                            last_active: row.last_active,
                        };
                    }
                )
            );
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load payers";
            setError(message);
            setDbPayers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPayers();
    }, [fetchPayers]);

    const payers = useMemo(() => {
        if (dbPayers.length === 0 && (!events || events.length === 0))
            return dbPayers;

        const allAssets = getAllAssets();
        const assetMapByEndpoint = new Map<string, string>();
        allAssets.forEach((asset) => {
            if (asset.endpoint) {
                assetMapByEndpoint.set(asset.endpoint.toLowerCase(), asset.category);
            }
        });

        const mergedMap = new Map<string, Payer>();

        dbPayers.forEach((p) => {
            mergedMap.set(p.address.toLowerCase(), { ...p });
        });

        if (events && events.length > 0) {
            const eventsByPayer = new Map<
                string,
                { address: string; evts: typeof events }
            >();

            events.forEach((ev) => {
                if (ev.status === "failed" || !ev.payer) return;
                const key = ev.payer.toLowerCase();
                if (!eventsByPayer.has(key)) {
                    eventsByPayer.set(key, { address: ev.payer, evts: [] });
                }
                eventsByPayer.get(key)!.evts.push(ev);
            });

            eventsByPayer.forEach((group, key) => {
                const sorted = [...group.evts].sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );

                const payments = sorted.length;
                const totalSpend = sorted.reduce(
                    (sum, ev) => sum + parseAmount(ev.amount_usdc),
                    0
                );
                const avgPayment = payments > 0 ? totalSpend / payments : 0;

                const assetSet = new Set<string>();
                sorted.forEach((ev) => {
                    const id = ev.asset_name || ev.endpoint;
                    if (id) assetSet.add(id);
                });

                const categoryCounts = new Map<string, number>();
                sorted.forEach((ev) => {
                    const endpointLower = (ev.endpoint || "").toLowerCase();
                    let rawCategory = assetMapByEndpoint.get(endpointLower);
                    if (!rawCategory) {
                        if (endpointLower.includes("/context")) rawCategory = "context";
                        else if (endpointLower.includes("/trace")) rawCategory = "trace";
                        else if (endpointLower.includes("/retrieval"))
                            rawCategory = "retrieval";
                        else if (endpointLower.includes("/tool"))
                            rawCategory = "tool run";
                        else if (endpointLower.includes("/memory"))
                            rawCategory = "memory";
                        else if (endpointLower.includes("/artifact"))
                            rawCategory = "artifact";
                        else if (endpointLower.includes("/eval"))
                            rawCategory = "evaluation";
                        else if (endpointLower.includes("/obs"))
                            rawCategory = "observability";
                        else if (endpointLower.includes("/error"))
                            rawCategory = "error analysis";
                        else if (endpointLower.includes("/session"))
                            rawCategory = "session";
                        else rawCategory = "context";
                    }
                    const displayCategory =
                        CATEGORY_DISPLAY_MAP[rawCategory] || rawCategory;
                    categoryCounts.set(
                        displayCategory,
                        (categoryCounts.get(displayCategory) || 0) + 1
                    );
                });

                const topCategories = Array.from(categoryCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat]) => cat);

                const existing = mergedMap.get(key);
                if (existing) {
                    mergedMap.set(key, {
                        ...existing,
                        unique_assets: Math.max(existing.unique_assets, assetSet.size),
                        payments: Math.max(existing.payments, payments),
                        total_spend:
                            totalSpend > existing.raw_total_spend
                                ? totalSpend.toFixed(4)
                                : existing.total_spend,
                        raw_total_spend: Math.max(existing.raw_total_spend, totalSpend),
                        avg_payment:
                            avgPayment > existing.raw_avg_payment
                                ? avgPayment.toFixed(4)
                                : existing.avg_payment,
                        raw_avg_payment: Math.max(existing.raw_avg_payment, avgPayment),
                        buys:
                            topCategories.length > 0
                                ? topCategories.slice(0, 2)
                                : existing.buys,
                        last_active: sorted[0]?.created_at || existing.last_active,
                    });
                } else {
                    mergedMap.set(key, {
                        id: `payer-event-${key}`,
                        address: group.address,
                        buys: topCategories.slice(0, 2),
                        unique_assets: assetSet.size,
                        payments,
                        total_spend: totalSpend.toFixed(4),
                        raw_total_spend: totalSpend,
                        avg_payment: avgPayment.toFixed(4),
                        raw_avg_payment: avgPayment,
                        last_active: sorted[0]?.created_at || "recently",
                    });
                }
            });
        }

        return Array.from(mergedMap.values()).sort(
            (a, b) => b.raw_total_spend - a.raw_total_spend
        );
    }, [dbPayers, events]);

    return {
        payers,
        loading: loading || loadingEvents,
        error,
        retry: fetchPayers,
        events: events || [],
    };
}
