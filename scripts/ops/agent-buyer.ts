import "dotenv/config";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import {
  createWalletClient,
  createPublicClient,
  http,
  erc20Abi,
  parseUnits,
  parseEther,
} from "viem";
import { arcTestnet } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import * as readline from "node:readline/promises";

// --- Parse CLI args ---
function parseArgs() {
  const args = process.argv.slice(2);
  let spendingLimit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      const val = parseFloat(args[i + 1]);
      if (isNaN(val) || val <= 0) {
        console.error("--limit must be a positive number (USDC amount)");
        process.exit(1);
      }
      spendingLimit = val;
      i++;
    }
  }

  return { spendingLimit };
}

let { spendingLimit } = parseArgs();
let totalSpent = 0;
let paused = false;

if (spendingLimit !== null) {
  console.log(`Spending limit: ${spendingLimit} USDC`);
}

async function promptForAllowance(): Promise<number> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      "\nSpending limit reached. Enter additional allowance in USDC (or 0 to quit): ",
    );
    const val = parseFloat(answer);
    if (isNaN(val) || val < 0) {
      console.error("Invalid amount. Exiting.");
      process.exit(0);
    }
    if (val === 0) {
      console.log(`Agent stopped. Total spent: ${totalSpent.toFixed(6)} USDC`);
      process.exit(0);
    }
    return val;
  } finally {
    rl.close();
  }
}

// --- Funder wallet ---
const funderKey = process.env.BUYER_PRIVATE_KEY as `0x${string}` | undefined;
if (!funderKey) {
  console.error("Missing BUYER_PRIVATE_KEY in .env");
  process.exit(1);
}

const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000" as const;
const ARC_TESTNET_RPC = "https://rpc.testnet.arc.network";

const BASE_URL = process.env.BASE_URL ?? "https://harness.money";
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT ?? "3";
const GAS_FUND_AMOUNT = parseEther("0.01");

// --- Asset content endpoints on Harness.money ---
const endpoints = [
  { url: `${BASE_URL}/api/assets/ai-observability-dataset-multi-model-inference-traces/content`, method: "GET" as const },
  { url: `${BASE_URL}/api/assets/short-context-window-synthetic-simulation/content`, method: "GET" as const },
  { url: `${BASE_URL}/api/assets/synthetic-llm-eval-multi-category-benchmark-suite/content`, method: "GET" as const },
  { url: `${BASE_URL}/api/assets/ai-tool-run-multi-step-agent-execution-traces/content`, method: "GET" as const },
];

// --- Generate ephemeral wallet ---
const ephemeralKey = generatePrivateKey();
const ephemeralAccount = privateKeyToAccount(ephemeralKey);
console.log(`Ephemeral agent wallet: ${ephemeralAccount.address}`);

// --- Fund the ephemeral wallet from the funder ---
const funderAccount = privateKeyToAccount(funderKey);
const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});
const funderWallet = createWalletClient({
  account: funderAccount,
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});

console.log(`Funding ephemeral wallet from funder ${funderAccount.address}...`);

const usdcAmount = parseUnits(DEPOSIT_AMOUNT, 6);

async function withNonceRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const isNonceError =
        msg.includes("replacement transaction underpriced") ||
        msg.includes("nonce too low") ||
        msg.includes("already known");
      if (!isNonceError || attempt === MAX_RETRIES - 1) throw err;
      const delay = 1000 + Math.random() * 2000;
      console.log(`  ${label}: nonce collision, retrying in ${Math.round(delay)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  // Send native USDC for gas, then ERC-20 USDC
  const gasTxHash = await withNonceRetry(
    () => funderWallet.sendTransaction({ to: ephemeralAccount.address, value: GAS_FUND_AMOUNT }),
    "Gas tx",
  );
  await publicClient.waitForTransactionReceipt({ hash: gasTxHash });
  console.log(`  Gas funded (${gasTxHash.slice(0, 10)}...)`);

  const usdcTxHash = await withNonceRetry(
    () => funderWallet.writeContract({
      address: ARC_TESTNET_USDC,
      abi: erc20Abi,
      functionName: "transfer",
      args: [ephemeralAccount.address, usdcAmount],
    }),
    "USDC tx",
  );
  await publicClient.waitForTransactionReceipt({ hash: usdcTxHash });
  console.log(`  USDC transferred (${usdcTxHash.slice(0, 10)}...)`);

  // --- Create GatewayClient with the ephemeral wallet ---
  const gateway = new GatewayClient({
    chain: "arcTestnet",
    privateKey: ephemeralKey,
  });

  let index = 0;
  let inFlight = 0;
  let redepositing = false;
  let consecutiveFailures = 0;
  let paymentInterval: ReturnType<typeof setInterval>;
  let balanceInterval: ReturnType<typeof setInterval>;

  const REDEPOSIT_THRESHOLD = BigInt(500_000);

  async function depositToGateway() {
    console.log(`Depositing ${DEPOSIT_AMOUNT} USDC into Gateway Wallet...`);
    const result = await gateway.deposit(DEPOSIT_AMOUNT);
    console.log(`Deposit complete! TX: ${result.depositTxHash}`);
    const updated = await gateway.getBalances();
    console.log(`Gateway available balance: ${updated.gateway.formattedAvailable}`);
  }

  async function refundAndRedeposit() {
    const txHash = await withNonceRetry(
      () => funderWallet.writeContract({
        address: ARC_TESTNET_USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [ephemeralAccount.address, usdcAmount],
      }),
      "Redeposit tx",
    );
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    await depositToGateway();
  }

  async function checkAndRedeposit() {
    if (redepositing || paused) return;
    redepositing = true;
    try {
      const balances = await gateway.getBalances();
      if (balances.gateway.available < REDEPOSIT_THRESHOLD) {
        console.log(`\nGateway balance low (${balances.gateway.formattedAvailable}), redepositing...`);
        if (balances.wallet.balance > BigInt(0)) {
          await depositToGateway();
        } else {
          await refundAndRedeposit();
        }
      }
    } catch (err) {
      console.error("Balance check failed:", (err as Error).message);
    } finally {
      redepositing = false;
    }
  }

  // Initial Gateway deposit
  await depositToGateway();

  console.log(`\nTarget: 1 transaction/second across ${endpoints.length} asset endpoints\n`);

  balanceInterval = setInterval(checkAndRedeposit, 30_000);

  async function handleLimitReached() {
    if (spendingLimit === null) return;

    paused = true;
    clearInterval(paymentInterval);
    clearInterval(balanceInterval);

    while (inFlight > 0) {
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`\nSpent ${totalSpent.toFixed(6)} / ${spendingLimit.toFixed(6)} USDC (limit reached)`);

    const additional = await promptForAllowance();
    spendingLimit += additional;
    console.log(`New limit: ${spendingLimit.toFixed(6)} USDC (total spent so far: ${totalSpent.toFixed(6)} USDC)`);

    paused = false;
    startPaymentLoop();
  }

  function startPaymentLoop() {
    balanceInterval = setInterval(checkAndRedeposit, 30_000);

    const MAX_PRICE = 0.10;
    const MAX_CONSECUTIVE_FAILURES = 3;

    paymentInterval = setInterval(() => {
      if (paused) return;

      if (spendingLimit !== null && totalSpent + MAX_PRICE > spendingLimit) {
        console.log(`\nBudget nearly exhausted (spent: ${totalSpent.toFixed(6)}/${spendingLimit.toFixed(6)} USDC). Stopping.`);
        clearInterval(paymentInterval);
        clearInterval(balanceInterval);
        handleLimitReached();
        return;
      }

      const ep = endpoints[index % endpoints.length];
      index++;
      inFlight++;

      const start = Date.now();
      gateway
        .pay(ep.url, { method: ep.method })
        .then((result) => {
          inFlight--;
          consecutiveFailures = 0;
          const ms = Date.now() - start;
          const amount = parseFloat(result.formattedAmount);
          totalSpent += amount;

          const limitInfo = spendingLimit !== null
            ? ` [spent: ${totalSpent.toFixed(6)}/${spendingLimit.toFixed(6)} USDC]`
            : "";
          const assetName = ep.url.split("/assets/")[1]?.split("/")[0] ?? ep.url;
          console.log(
            `#${index} ${ep.method} ${assetName} -> ${result.formattedAmount} USDC (${ms}ms) [in-flight: ${inFlight}]${limitInfo}`,
          );

          if (spendingLimit !== null && totalSpent >= spendingLimit) {
            handleLimitReached();
          }
        })
        .catch((err) => {
          inFlight--;
          consecutiveFailures++;
          const ms = Date.now() - start;
          const assetName = ep.url.split("/assets/")[1]?.split("/")[0] ?? ep.url;
          console.error(
            `#${index} ${assetName} FAILED (${ms}ms): ${err.message} [in-flight: ${inFlight}]`,
          );

          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.log(`\n${MAX_CONSECUTIVE_FAILURES} consecutive failures — Gateway balance likely depleted. Stopping.`);
            console.log(`Total spent: ${totalSpent.toFixed(6)} USDC`);
            clearInterval(paymentInterval);
            clearInterval(balanceInterval);
            process.exit(0);
          }
        });
    }, 1000);
  }

  startPaymentLoop();
}

main().catch(console.error);
