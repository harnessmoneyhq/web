export type AssetCategory =
  | "session"
  | "context"
  | "trace"
  | "tool run"
  | "retrieval"
  | "memory"
  | "artifact"
  | "evaluation"
  | "observability"
  | "error analysis";

export interface AssetItem {
  id: string;
  rank: number;
  name: string;
  category: AssetCategory;
  model: string;
  price: string;
  downloads: string;
  sparkline: number[];
  official?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  isHot?: boolean;
  description: string;
  endpoint: string;
  httpMethod: "GET" | "POST";
  sellerAddress?: string;
  stats: {
    uptime: string;
    latency: string;
    successRate: string;
    calls30d: string;
  };
  codeSnippets: {
    curl: string;
    typescript: string;
    python: string;
  };
}

export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  session: "Sessions",
  context: "Context",
  trace: "Traces",
  "tool run": "Tool Runs",
  retrieval: "Retrievals",
  memory: "Memory",
  artifact: "Artifacts",
  evaluation: "Evals",
  observability: "Observability",
  "error analysis": "Error Analysis",
};
