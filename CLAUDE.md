@AGENTS.md

# Harness.money - AI Asset Marketplace

Next.js 16 + React 19 dark-themed marketplace for AI execution assets, settled via USDC on the Arc testnet through the x402 payment protocol.

## Stack

- **Framework**: Next.js 16.3.0 (App Router, Turbopack)
- **Language**: TypeScript 5, strict mode
- **Styling**: Tailwind CSS 4, shadcn/ui (radix-ui), tw-animate-css
- **Payments**: Circle Gateway x402 batching (`@circle-fin/x402-batching`), `@x402/evm`
- **Data**: Supabase (assets, sellers, payers tables + realtime subscriptions for payment events)
- **Fonts**: Geist Sans + Geist Mono
- **Identicons**: `blo` library for EVM address avatars

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (eslint-config-next/core-web-vitals + typescript)
```

## Project Structure

```
app/
  page.tsx                    # Home: hero + assets leaderboard
  layout.tsx                  # Root layout (Navbar + Footer, dark class)
  transactions/page.tsx       # Live transactions feed (client component, Suspense)
  agents/page.tsx             # Payer wallets leaderboard
  agents/[address]/page.tsx   # Payer detail profile
  sellers/page.tsx            # Seller wallets leaderboard
  sellers/[address]/page.tsx  # Seller detail profile
  assets/[id]/page.tsx        # Asset detail (server component with generateMetadata)
  api/assets/[id]/content/route.ts  # x402-gated asset content endpoint
  api/publish/route.ts        # x402-gated asset publish endpoint
components/
  data-table.tsx              # Generic paginated/sortable/searchable table
  asset-detail-view.tsx       # Asset detail view (client component)
  assets-leaderboard.tsx      # Home page leaderboard (its own sort/filter/pagination)
  navbar.tsx, footer.tsx      # App shell
  copyable-cell.tsx           # Clipboard copy cell with internal/external link support
  identicon.tsx               # EVM address avatar via blo()
  hero-section.tsx            # Hero with ASCII art + agent marquee
  ui/                         # shadcn/ui primitives (table, badge, tabs, tooltip, select, input, button)
hooks/
  use-assets.ts               # Supabase assets query with DB row → AssetItem mapping
  use-transactions.ts         # Supabase realtime payment events
  use-sellers.ts              # Supabase sellers + realtime event merging
  use-payers.ts               # Supabase payers + realtime event merging
lib/
  assets-data.ts              # Types (AssetCategory, AssetItem) and CATEGORY_DISPLAY_MAP constant
  x402.ts                     # x402 payment middleware (Circle Gateway verify/settle + Supabase logging)
  publish-prompt.ts           # LLM prompt for guided asset publishing flow
  supabase/client.ts          # Browser Supabase client (@supabase/ssr)
  supabase/server.ts          # Server Supabase client (@supabase/supabase-js, for server components)
  utils.ts                    # Formatting helpers (addresses, USDC, dates, pagination)
```

## Key Patterns

- **Data flow**: Each entity has its own Supabase table (`assets`, `sellers`, `payers`, `payment_events`). Hooks fetch from their table and merge with realtime payment events via `useMemo`. The asset detail page (`assets/[id]`) queries Supabase server-side.
- **x402 payment flow**: `withGateway()` in `lib/x402.ts` wraps API routes. It issues a 402 challenge with payment requirements, verifies/settles via Circle's `BatchFacilitatorClient`, logs to `payment_events`, and increments asset stats (downloads, sparkline, calls30d) on content unlock.
- **DB row mapping**: Supabase rows use snake_case (`is_new`, `http_method`, `seller_address`); the app maps them to camelCase `AssetItem` properties. The `mapRowToAsset` pattern is used in `use-assets.ts`, `app/assets/[id]/page.tsx`, and `app/sellers/[address]/page.tsx`.
- **Category resolution**: Payer "buys" categories are resolved via URL-based heuristic on endpoint paths (e.g. `/context` → "context", `/tool` → "tool run"), not by looking up assets. `CATEGORY_DISPLAY_MAP` converts raw categories to display labels.
- **Transaction IDs**: Circle Gateway's `settleResult.transaction` is stored in `gateway_tx`. These are not `0x`-prefixed blockchain hashes — they are Circle's settlement reference IDs.
- **Dark-only UI**: The app is hardcoded dark mode (`html.dark`, `bg-black`). No light mode support.
- **Brand color**: `#97E600` (lime green) used for accents, active states, and USDC amounts.
- **Explorer**: EVM addresses and `0x`-prefixed transaction hashes link to `https://testnet.arcscan.app`.
- **`"use client"`**: All pages except `assets/[id]/page.tsx` are client components. The assets detail page is a server component that delegates rendering to `AssetDetailView`.

## Environment Variables

Required in `.env` (gitignored):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side, used by x402 middleware and API routes)
- `SELLER_ADDRESS` (treasury `0x` address for anti-spam payment collection)

## Conventions

- Use `font-mono` for data-heavy UI (tables, stats, addresses, amounts).
- Use `cn()` from `lib/utils.ts` for conditional class merging.
- EVM addresses: validate with `isEvmAddress()`, shorten with `shortenHash()`, render avatars with `Identicon` or `blo()`.
- USDC amounts: format with `formatUsdcAmount()` (smart 2/4 decimal display).
- The `DataTable` component handles pagination, sorting, and search generically - prefer it over building custom tables.
- Assets link to `/assets/{id}`, sellers to `/sellers/{address}`, agents/payers to `/agents/{address}`.
- Use `next/image` with `unoptimized` for data-URI images (e.g. `blo()` identicons) — avoids `@next/next/no-img-element` lint warnings.
- Canonical types and constants live in `lib/assets-data.ts` (`AssetCategory`, `AssetItem`, `CATEGORY_DISPLAY_MAP`) — import from there, never redeclare locally.
- Avoid `Date.now()` or other impure calls inside `useMemo`/render — use `useRef` to capture the value once at mount time.
- Supabase realtime channels use a stable name per table (e.g. `"payment_events_realtime"`) and clean up via the local `channel` variable in the effect's return, not a shared ref.
- Sync external prop changes into state using the "previous value" pattern (compare + set during render), not `useEffect` with `setState`.
