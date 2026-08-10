import "dotenv/config";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { readFileSync } from "fs";

const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey: process.env.PUBLISHER_3_PRIVATE_KEY as `0x${string}`,
});

const content = readFileSync("../data/tool-run-content.json", "utf-8");

const asset = {
  title: "AI Tool Run — Multi-Step Agent Execution Traces",
  category: "tool run",
  price: "0.1",
  description:
    "24 synthetic agent runs with 46 tool calls across 6 tools (email, web search, weather, calendar, database, file ops) — includes per-call latency, retry handling, success rates, token usage, and output summaries.",
  content,
  model: "claude-sonnet-4-6",
};

async function main() {
  console.log("Publishing tool run dataset...");
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
