import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/x402";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;

    const { data: asset, error } = await supabase
        .from("assets")
        .select("price, seller_address, content, name, category")
        .eq("id", id)
        .single();

    if (error || !asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (!asset.content) {
        return NextResponse.json({ error: "No content available for this asset" }, { status: 404 });
    }

    const handler = async () => {
        return NextResponse.json({
            id,
            name: asset.name,
            category: asset.category,
            content: asset.content,
        });
    };

    const gatedHandler = withGateway(
        handler,
        asset.price,
        `/api/assets/${id}/content`,
        asset.seller_address as `0x${string}` | undefined,
    );

    return gatedHandler(req);
}
