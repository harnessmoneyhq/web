import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AssetItem } from "@/lib/assets-data";

export function useAssets() {
    const [assets, setAssets] = useState<AssetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data, error: dbError } = await supabase
                .from("assets")
                .select("*")
                .order("rank", { ascending: true });

            if (dbError) {
                throw new Error(dbError.message);
            }

            if (!data) {
                throw new Error("No data returned from assets table");
            }

            setAssets(
                data.map(
                    (row: {
                        id: string;
                        rank: number;
                        name: string;
                        category: string;
                        model: string;
                        price: string;
                        downloads: string;
                        sparkline: number[];
                        official: boolean;
                        is_new: boolean;
                        is_trending: boolean;
                        is_hot: boolean;
                        description: string;
                        endpoint: string;
                        http_method: string;
                        seller_address: string | null;
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
                    })
                )
            );
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load assets";
            setError(message);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return { assets, loading, error, retry: fetchAssets };
}
