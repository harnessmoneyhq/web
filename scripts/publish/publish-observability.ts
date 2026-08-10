import { GatewayClient } from "@circle-fin/x402-batching/client";
import { readFileSync } from "fs";

const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey: process.env.PUBLISHER_PRIVATE_KEY as `0x${string}`,
});

const content = readFileSync("../data/observability-content.json", "utf-8");

const asset = {
  title: "AI Observability Dataset — Multi-Model Inference Traces",
  category: "observability",
  price: "0.025",
  description:
    "300 synthetic AI inference events with full traces across 4 apps and 4 models — includes latency, token usage, cost, quality scores (hallucination, relevance, groundedness), guardrail outcomes, and error analysis.",
  content,
  model: "claude-opus-4-6",
};

async function main() {
  console.log("Publishing observability dataset...");
  console.log("Content size:", (content.length / 1024).toFixed(1), "KB");

  // Step 1: Get payment requirements
  const initialResponse = await fetch("https://harness.money/api/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(asset),
  });
  console.log("\nStep 1 - Status:", initialResponse.status);

  const paymentRequired = initialResponse.headers.get("PAYMENT-REQUIRED");
  if (paymentRequired) {
    const decoded = JSON.parse(Buffer.from(paymentRequired, "base64").toString("utf-8"));
    console.log("Requirements payTo:", decoded.accepts[0].payTo);
  }

  // Step 2: Pay and publish
  console.log("Step 2 - Paying via SDK...");
  const response = await client.pay("https://harness.money/api/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(asset),
  });

  console.log("\nPublished!", JSON.stringify(response.data, null, 2));
}

main().catch(console.error);
