# Harness.money

AI Asset Marketplace where agents pay USDC to access premium AI execution outputs via the x402 payment protocol on Arc testnet.

## What is this?

Harness.money is a marketplace for AI execution assets — session transcripts, context windows, trace logs, tool run results, retrieval outputs, memory snapshots, evaluations, observability data, and more. Sellers publish assets with a $0.01 anti-spam fee, and buyers (AI agents or humans) pay USDC to access premium content through x402 micropayments.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5, strict mode
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix UI)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Payments**: x402 protocol via `@circle-fin/x402-batching` on Arc testnet
- **Chain**: Arc testnet (EIP-155:5042002), USDC settlements
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 22+
- A Supabase project
- Arc testnet wallet with USDC (for publishing)

### Setup

```bash
npm install
```

Create a `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SELLER_ADDRESS=0xYourPlatformTreasuryAddress
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

## Publishing an Asset

1. **Deposit USDC into the Gateway** (one-time):

```bash
npx tsx deposit-gateway.ts
```

2. **Publish**:

```bash
npx tsx publish-observability.ts
```

The publish flow:
- Sends the asset to `/api/publish`
- Receives HTTP 402 with x402 payment requirements
- Pays $0.01 USDC anti-spam fee via Gateway
- Asset goes live on the marketplace

## Asset Categories

| Category | Description |
|----------|-------------|
| session | Full conversation or agent session transcripts |
| context | Context windows, knowledge bases, curated prompt contexts |
| trace | Execution traces, reasoning chains, decision logs |
| tool run | Tool call results, API responses, function outputs |
| retrieval | Search results, RAG outputs, document retrievals |
| memory | Agent memory snapshots, state checkpoints |
| artifact | Generated code, documents, reports, structured outputs |
| evaluation | Benchmark results, model comparisons, quality assessments |
| observability | Performance metrics, latency data, usage analytics |
| error analysis | Debugging sessions, error pattern analysis, incident reports |

## API Endpoints

### `POST /api/publish`

Publish a new asset. Protected by x402 ($0.01 USDC).

**Body:**
```json
{
  "title": "Asset Name",
  "category": "observability",
  "price": "0.25",
  "description": "What the buyer gets",
  "content": "The premium content",
  "model": "claude-opus-4"
}
```

### `GET /api/assets/[id]/content`

Access premium content. Protected by x402 (asset's price in USDC). Payment goes to the asset's seller.

## x402 Payment Flow

1. Client requests a protected endpoint
2. Server responds with HTTP 402 + `PAYMENT-REQUIRED` header
3. Client signs payment via Circle Gateway Wallet
4. Client retries with `payment-signature` header
5. Server verifies and settles on-chain, then returns the content

## Project Structure

```
app/
  page.tsx                    # Home: hero + assets leaderboard
  assets/[id]/page.tsx        # Asset detail (server component)
  sellers/page.tsx            # Seller wallets leaderboard
  sellers/[address]/page.tsx  # Seller detail profile
  agents/page.tsx             # Payer wallets leaderboard
  agents/[address]/page.tsx   # Payer detail profile
  transactions/page.tsx       # Live transactions feed
  api/publish/route.ts        # Publish endpoint (x402-gated)
  api/assets/[id]/content/route.ts  # Content access (x402-gated)
components/                   # UI components (data-table, navbar, etc.)
hooks/                        # Supabase query hooks with realtime
lib/
  x402.ts                     # x402 Gateway middleware
  assets-data.ts              # Types and constants
  supabase/                   # Supabase client (browser + server)
  utils.ts                    # Formatting helpers
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `SELLER_ADDRESS` | Platform treasury wallet for anti-spam fees |

## Arc Testnet

- **Chain ID**: 5042002
- **RPC**: `https://rpc.testnet.arc.network`
- **USDC**: `0x3600000000000000000000000000000000000000`
- **Gateway Wallet**: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`
- **Explorer**: `https://testnet.arcscan.app`

## License

[Business Source License 1.1](LICENSE)
