import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePaymentEvents } from "@/hooks/use-transactions";
import { getSellerSpecialties } from "@/lib/assets-data";

export type Seller = {
    id: string;
    name: string;
    address: string;
    specialties: string[];
    assets_count: number;
    total_sales: number;
    total_revenue_usdc: string;
    avg_sale_usdc: string;
    last_active: string;
    network: string;
    verified: boolean;
};

export const ALLOWED_SPECIALTIES = [
    "Sessions",
    "Context",
    "Traces",
    "Tool runs",
    "Retrievals",
    "Memory",
    "Artifacts",
    "Evals",
    "Observability",
    "Error Analysis",
] as const;

export function useSellers() {
    const [dbSellers, setDbSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { events, loading: loadingEvents } = usePaymentEvents();

    const fetchSellers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data, error: dbError } = await supabase
                .from("sellers")
                .select("*")
                .order("total_sales", { ascending: false });

            if (dbError) {
                throw new Error(dbError.message);
            }

            if (!data) {
                throw new Error("No data returned from sellers table");
            }

            setDbSellers(data as Seller[]);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load sellers";
            setError(message);
            setDbSellers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSellers();
    }, [fetchSellers]);

    const sellers = useMemo(() => {
        if (dbSellers.length === 0) return [];

        const mergedMap = new Map<string, Seller>();

        dbSellers.forEach((s) => {
            mergedMap.set(s.address.toLowerCase(), { ...s });
        });

        if (events && events.length > 0) {
            const eventMap = new Map<string, {
                address: string;
                endpoints: Set<string>;
                calls: number;
                revenue: number;
                networks: Set<string>;
            }>();

            events.forEach((ev) => {
                const rawAddr = ev.seller || ev.seller_address || ev.merchant_address || "";
                const key = rawAddr.toLowerCase();

                if (!eventMap.has(key)) {
                    eventMap.set(key, {
                        address: rawAddr,
                        endpoints: new Set(),
                        calls: 0,
                        revenue: 0,
                        networks: new Set(),
                    });
                }

                const item = eventMap.get(key)!;
                item.endpoints.add(ev.endpoint);
                item.calls += 1;
                item.revenue += parseFloat(ev.amount_usdc.replace(/,/g, "")) || 0;
                if (ev.network) item.networks.add(ev.network);
            });

            eventMap.forEach((evt, key) => {
                const existing = mergedMap.get(key);
                if (existing) {
                    const totalSales = evt.calls;
                    const totalRevenue = evt.revenue;
                    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;
                    const totalAssets = Math.max(existing.assets_count, evt.endpoints.size);

                    mergedMap.set(key, {
                        ...existing,
                        assets_count: totalAssets,
                        total_sales: totalSales,
                        total_revenue_usdc: totalRevenue.toFixed(4),
                        avg_sale_usdc: avgSale.toFixed(4),
                        last_active: "just now",
                        network: Array.from(evt.networks)[0] || existing.network,
                        verified: false,
                    });
                } else {
                    const avgSale = evt.calls > 0 ? evt.revenue / evt.calls : 0;
                    mergedMap.set(key, {
                        id: `seller-event-${key}`,
                        name: `Seller ${evt.address.slice(0, 6)}...${evt.address.slice(-4)}`,
                        address: evt.address,
                        specialties: ["Context", "Traces"],
                        assets_count: evt.endpoints.size || 1,
                        total_sales: evt.calls,
                        total_revenue_usdc: evt.revenue.toFixed(4),
                        avg_sale_usdc: avgSale.toFixed(4),
                        last_active: "just now",
                        network: Array.from(evt.networks)[0] || "Arc Testnet",
                        verified: false,
                    });
                }
            });
        }

        return Array.from(mergedMap.values()).map((seller) => ({
            ...seller,
            specialties: getSellerSpecialties(seller.address),
        }));
    }, [dbSellers, events]);

    return {
        sellers,
        loading: loading || loadingEvents,
        error,
        retry: fetchSellers,
    };
}
