import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type PaymentEvent = {
    id: string;
    created_at: string;
    endpoint: string;
    asset_name?: string | null;
    payer: string;
    seller?: string | null;
    seller_address?: string | null;
    merchant_address?: string | null;
    amount_usdc: string;
    network: string;
    gateway_tx: string | null;
    status?: "settled" | "pending" | "failed" | string;
    raw: Record<string, unknown> | null;
};

export function usePaymentEvents() {
    const [events, setEvents] = useState<PaymentEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data, error: dbError } = await supabase
                .from("payment_events")
                .select("*")
                .order("created_at", { ascending: false });

            if (dbError) {
                throw new Error(dbError.message);
            }

            if (!data) {
                throw new Error("No data returned from payment_events table");
            }

            setEvents(data as PaymentEvent[]);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load payment events";
            setError(message);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();

        const supabase = createClient();
        const channelName = `payment_events_rt_${Math.random().toString(36).slice(2)}`;
        const channel = supabase.channel(channelName);

        channel.on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "payment_events" },
            (payload) => {
                const newRecord = payload.new as PaymentEvent;
                setEvents((prev) => {
                    if (prev.some((e) => e.id === newRecord.id)) return prev;
                    return [newRecord, ...prev];
                });
            }
        );

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchEvents]);

    return { events, loading, error, retry: fetchEvents };
}
