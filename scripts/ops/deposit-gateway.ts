import { GatewayClient } from "@circle-fin/x402-batching/client";

const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey: process.env.PUBLISHER_3_PRIVATE_KEY as `0x${string}`,
});

async function main() {
  console.log("Checking balances...");
  const balances = await client.getBalances();
  console.log("Full balances object:", JSON.stringify(balances, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));

  console.log("\nDepositing 1 USDC into Gateway...");
  const result = await client.deposit("1");
  console.log("Deposit result:", JSON.stringify(result, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));

  const updatedBalances = await client.getBalances();
  console.log("\nUpdated balances:", JSON.stringify(updatedBalances, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
}

main().catch(console.error);
