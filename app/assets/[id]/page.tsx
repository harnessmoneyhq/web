import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssetDetailView } from "@/components/asset-detail-view";
import type { AssetItem } from "@/lib/assets-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

function mapRowToAsset(row: {
  id: string;
  rank: number;
  name: string;
  category: string;
  model: string;
  price: string;
  downloads: string;
  sparkline: number[];
  official: boolean;
  is_new: boolean;
  is_trending: boolean;
  is_hot: boolean;
  description: string;
  endpoint: string;
  http_method: string;
  seller_address: string | null;
  stats: { uptime?: string; latency?: string; successRate?: string; calls30d?: string } | null;
}): AssetItem {
  return {
    id: row.id,
    rank: row.rank,
    name: row.name,
    category: row.category as AssetItem["category"],
    model: row.model,
    price: row.price,
    downloads: row.downloads,
    sparkline: row.sparkline || [],
    official: row.official,
    isNew: row.is_new,
    isTrending: row.is_trending,
    isHot: row.is_hot,
    description: row.description || "",
    endpoint: row.endpoint,
    httpMethod: (row.http_method || "GET") as "GET" | "POST",
    sellerAddress: row.seller_address || undefined,
    stats: {
      uptime: row.stats?.uptime ?? "99.9%",
      latency: row.stats?.latency ?? "50ms",
      successRate: row.stats?.successRate ?? "99.9%",
      calls30d: row.stats?.calls30d ?? "0",
    },
    codeSnippets: {
      curl: `curl -X ${row.http_method || "GET"} ${row.endpoint} -H "Authorization: Bearer $AGENT_USDC_KEY"`,
      typescript: `const res = await fetch("${row.endpoint}");`,
      python: `res = requests.${(row.http_method || "GET").toLowerCase()}("${row.endpoint}")`,
    },
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from("assets")
    .select("name, description")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Asset Not Found" };
  }

  return {
    title: `${data.name} - Agentic Marketplace`,
    description: data.description,
  };
}

export default async function AssetPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const asset = mapRowToAsset(data);

  return <AssetDetailView asset={asset} />;
}
