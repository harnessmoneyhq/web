/* It is a Next.js API route wrapper (higher-order middleware) that enforces and settles x402 USDC pay-per-call payments via Circle Gateway on the Arc Testnet.

Key Responsibilities
buildPaymentRequirements(price)

Converts dollar price strings (e.g., "$0.80") into 6-decimal USDC atomic units (800000).
Constructs the x402 payment requirements schema, specifying the seller address, Arc Testnet network (eip155:5042002), USDC token address, and Gateway Wallet verifier contract.
withGateway(handler, price, endpoint) Middleware Flow

Step 1 — 402 Challenge: Checks requests for a payment-signature header. If missing, responds with HTTP 402 Payment Required containing a base64-encoded PAYMENT-REQUIRED specification header.
Step 2 — Verification & Settlement: If a signature is provided, it uses Circle's BatchFacilitatorClient to verify signature validity and execute on-chain settlement via Gateway.
Step 3 — Audit Logging: Writes settled payment details (payer, amount_usdc, endpoint, gateway_tx) into the Supabase payment_events table.
Step 4 — Execution & Response Header: Invokes the protected route handler and attaches a base64-encoded PAYMENT-RESPONSE header containing transaction proof for the calling client.
Summary
Summarized lib/x402.ts as an x402 HTTP 402 middleware wrapper that handles payment requirement generation, Circle Gateway settlement verification, Supabase event logging, and route execution. */

import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Arc Testnet contract addresses (from @circle-fin/x402-batching SDK)
const ARC_TESTNET_NETWORK = "eip155:5042002";
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";
const ARC_TESTNET_GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

export const sellerAddress = process.env.SELLER_ADDRESS as `0x${string}`;

const facilitator = new BatchFacilitatorClient({
    url: "https://gateway-api-testnet.circle.com",
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PaymentPayload {
    x402Version: number;
    resource?: { url: string; description: string; mimeType: string };
    accepted?: Record<string, unknown>;
    payload: Record<string, unknown>;
    extensions?: Record<string, unknown>;
}

function buildPaymentRequirements(price: string, payTo?: `0x${string}`) {
    // Parse dollar amount to USDC atomic units (6 decimals)
    const amount = Math.round(parseFloat(price.replace("$", "")) * 1_000_000);

    return {
        scheme: "exact" as const,
        network: ARC_TESTNET_NETWORK,
        asset: ARC_TESTNET_USDC,
        amount: amount.toString(),
        payTo: payTo ?? sellerAddress,
        maxTimeoutSeconds: 345600,
        extra: {
            name: "GatewayWalletBatched",
            version: "1",
            verifyingContract: ARC_TESTNET_GATEWAY_WALLET,
        },
    };
}

/**
 * Wraps a Next.js route handler with Circle Gateway payment verification.
 *
 * payTo defaults to SELLER_ADDRESS (treasury) for anti-spam fees.
 * For content unlock routes, pass the asset's seller address as payTo
 * so payment goes directly to the content creator.
 */
export function withGateway(
    handler: (req: NextRequest) => Promise<NextResponse>,
    price: string,
    endpoint: string,
    payTo?: `0x${string}`,
    metadata?: { asset_name?: string },
) {
    const requirements = buildPaymentRequirements(price, payTo);

    return async (req: NextRequest) => {
        const paymentSignature = req.headers.get("payment-signature");

        // No payment — return 402 with Gateway batching payment requirements
        if (!paymentSignature) {
            console.log(`[x402] 402 Payment Required: ${endpoint}`);

            const paymentRequired = {
                x402Version: 2,
                resource: {
                    url: endpoint,
                    description: `Paid resource (${price} USDC)`,
                    mimeType: "application/json",
                },
                accepts: [requirements],
            };

            return new NextResponse(JSON.stringify({}), {
                status: 402,
                headers: {
                    "Content-Type": "application/json",
                    "PAYMENT-REQUIRED": Buffer.from(
                        JSON.stringify(paymentRequired),
                    ).toString("base64"),
                },
            });
        }

        // Payment present — verify and settle via Circle Gateway
        try {
            const paymentPayload: PaymentPayload = JSON.parse(
                Buffer.from(paymentSignature, "base64").toString("utf-8"),
            );

            const verifyResult = await facilitator.verify(
                paymentPayload,
                requirements,
            );

            if (!verifyResult.isValid) {
                return NextResponse.json(
                    {
                        error: "Payment verification failed",
                        reason: verifyResult.invalidReason,
                    },
                    { status: 402 },
                );
            }

            const settleResult = await facilitator.settle(
                paymentPayload,
                requirements,
            );

            if (!settleResult.success) {
                console.error(
                    `[x402] Settlement failed for ${endpoint}: ${settleResult.errorReason}`,
                );
                return NextResponse.json(
                    {
                        error: "Payment settlement failed",
                        reason: settleResult.errorReason,
                    },
                    { status: 402 },
                );
            }

            // Record payment event in Supabase
            const amountUsdc = (
                Number(requirements.amount) / 1e6
            ).toString();
            const payer = settleResult.payer ?? verifyResult.payer ?? "unknown";

            const { error } = await supabase.from("payment_events").insert({
                id: crypto.randomUUID(),
                endpoint,
                asset_name: metadata?.asset_name ?? null,
                payer,
                seller_address: requirements.payTo,
                amount_usdc: amountUsdc,
                network: requirements.network,
                gateway_tx: settleResult.transaction ?? null,
                status: "settled",
                raw: { requirements, settleResult },
            });

            if (error) {
                console.error("Failed to record payment event:", error.message);
            }

            // Increment asset unlock count
            const assetIdMatch = endpoint.match(/\/assets\/([^/]+)\/content/);
            if (assetIdMatch) {
                const { data: asset } = await supabase
                    .from("assets")
                    .select("downloads")
                    .eq("id", assetIdMatch[1])
                    .single();
                if (asset) {
                    await supabase
                        .from("assets")
                        .update({ downloads: String(Number(asset.downloads || 0) + 1) })
                        .eq("id", assetIdMatch[1]);
                }
            }

            console.log(
                `[x402] Payment settled: ${endpoint} — ${amountUsdc} USDC from ${payer}`,
            );

            // Inject settlement info into request headers so the handler can read it
            const settlementHeader = Buffer.from(
                JSON.stringify({
                    success: true,
                    transaction: settleResult.transaction,
                    network: requirements.network,
                    payer,
                }),
            ).toString("base64");
            req.headers.set("PAYMENT-RESPONSE", settlementHeader);

            // Call the actual route handler
            const response = await handler(req);

            // Forward settlement info to the client
            const settleResponseHeader = Buffer.from(
                JSON.stringify({
                    success: true,
                    transaction: settleResult.transaction,
                    network: requirements.network,
                    payer,
                }),
            ).toString("base64");

            response.headers.set("PAYMENT-RESPONSE", settleResponseHeader);
            return response;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            console.error("[x402] Payment processing error:", message);
            return NextResponse.json(
                { error: "Payment processing error", message },
                { status: 500 },
            );
        }
    };
}
