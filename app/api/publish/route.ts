import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/x402";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_CATEGORIES = [
    "session",
    "context",
    "trace",
    "tool run",
    "retrieval",
    "memory",
    "artifact",
    "evaluation",
    "observability",
    "error analysis",
] as const;

async function handlePublish(req: NextRequest): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { title, category, price, content, description, endpoint, http_method } = body;

        if (!title || !category || !price || !content) {
            return NextResponse.json(
                { error: "Missing required fields: title, category, price, content" },
                { status: 400 },
            );
        }

        if (!VALID_CATEGORIES.includes(category)) {
            return NextResponse.json(
                { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
                { status: 400 },
            );
        }

        const priceNum = parseFloat(price.toString().replace("$", ""));
        if (isNaN(priceNum) || priceNum <= 0) {
            return NextResponse.json(
                { error: "Price must be a positive number (e.g., '0.25' or '$0.25')" },
                { status: 400 },
            );
        }
        const priceFormatted = `$${priceNum.toFixed(2)}`;

        const paymentResponse = req.headers.get("PAYMENT-RESPONSE");
        let sellerAddress = body.seller_address || null;
        if (paymentResponse) {
            try {
                const settlement = JSON.parse(
                    Buffer.from(paymentResponse, "base64").toString("utf-8"),
                );
                if (settlement.payer) {
                    sellerAddress = settlement.payer;
                }
            } catch {
                // Fall through to body seller_address
            }
        }

        const id = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 80);

        const { data: existing } = await supabase
            .from("assets")
            .select("id")
            .eq("id", id)
            .single();

        const finalId = existing ? `${id}-${Date.now().toString(36)}` : id;

        const { data: maxRank } = await supabase
            .from("assets")
            .select("rank")
            .order("rank", { ascending: false })
            .limit(1)
            .single();
        const nextRank = (maxRank?.rank ?? 0) + 1;

        const assetRow = {
            id: finalId,
            rank: nextRank,
            name: title,
            category,
            model: body.model || "claude-opus-4",
            price: priceFormatted,
            downloads: "0",
            sparkline: [0, 0, 0, 0, 0, 0, 0, 0],
            official: false,
            is_new: true,
            is_trending: false,
            is_hot: false,
            description: description || title,
            endpoint: endpoint || `https://harness.money/api/assets/${finalId}/content`,
            http_method: http_method || "GET",
            seller_address: sellerAddress,
            stats: {
                uptime: "99.9%",
                latency: "50ms",
                successRate: "99.9%",
                calls30d: "0",
            },
            content,
        };

        const { error: insertError } = await supabase.from("assets").insert(assetRow);

        if (insertError) {
            console.error("[publish] Insert failed:", insertError.message);
            return NextResponse.json(
                { error: "Failed to publish asset", details: insertError.message },
                { status: 500 },
            );
        }

        console.log(`[publish] Asset published: ${finalId} by ${sellerAddress}`);

        return NextResponse.json({
            success: true,
            asset: {
                id: finalId,
                name: title,
                category,
                price: priceFormatted,
                seller_address: sellerAddress,
                url: `https://harness.money/assets/${finalId}`,
                content_url: `https://harness.money/api/assets/${finalId}/content`,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[publish] Error:", message);
        return NextResponse.json(
            { error: "Internal server error", message },
            { status: 500 },
        );
    }
}

export const POST = withGateway(handlePublish, "$0.01", "/api/publish");
