"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const AGENTS = [
  { name: "Antigravity", slug: "antigravity", logo: "/agents/logos/antigravity.svg" },
  { name: "Mastra", slug: "mastra", logo: "/agents/logos/mastra.svg" },
  { name: "Claude Code", slug: "claude-code", logo: "/agents/logos/claude-code.svg" },
  { name: "Cursor", slug: "cursor", logo: "/agents/logos/cursor.svg" },
  { name: "Gemini", slug: "gemini", logo: "/agents/logos/gemini.svg" },
  { name: "Windsurf", slug: "windsurf", logo: "/agents/logos/windsurf.svg" },
  { name: "Copilot", slug: "copilot", logo: "/agents/logos/copilot.svg" },
  { name: "Codex", slug: "codex", logo: "/agents/logos/codex.svg" },
  { name: "Zed", slug: "zed", logo: "/agents/logos/zed.svg" },
  { name: "Goose", slug: "goose", logo: "/agents/logos/goose.svg" },
  { name: "OpenCode", slug: "opencode", logo: "/agents/logos/opencode.svg" },
  { name: "Kiro CLI", slug: "kiro-cli", logo: "/agents/logos/kiro-cli.svg" },
  { name: "Kilo", slug: "kilo", logo: "/agents/logos/kilo.svg" },
  { name: "VS Code", slug: "vscode", logo: "/agents/logos/vscode.svg" },
  { name: "Strands Agents", slug: "strands", logo: "/agents/logos/strands-agents.svg" },
];

export function HeroSection() {
  const [copied, setCopied] = useState(false);
  const commandText = "npx skills add <owner/repo>";

  const handleCopy = () => {
    navigator.clipboard.writeText("Copy prompt to start selling");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-6 sm:py-8 lg:py-10 border-b border-neutral-900">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-x-8 lg:gap-x-14 gap-y-8 lg:gap-y-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1 Left: ASCII Banner */}
        <div className="flex flex-col gap-4">
          {/* ASCII Banner */}
          <div className="relative w-full max-w-full overflow-x-auto flex flex-col items-start">
            {/* HARNESS - Main Banner */}
            <pre className="text-[6px] min-[380px]:text-[7px] sm:text-[8px] lg:text-[9px] tracking-tight leading-[125%] text-neutral-300 font-mono select-none whitespace-pre">
              {`██╗  ██╗ █████╗ ██████╗ ███╗   ██╗███████╗███████╗███████╗
██║  ██║██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔════╝██╔════╝
███████║███████║██████╔╝██╔██╗ ██║█████╗  ███████╗███████╗
██╔══██║██╔══██║██╔══██╗██║╚██╗██║██╔══╝  ╚════██║╚════██║
██║  ██║██║  ██║██║  ██║██║ ╚████║███████╗███████║███████║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝`}
            </pre>

            {/* MONEY - Same Size, Right Aligned & Overlapped */}
            <pre className="text-[6px] min-[380px]:text-[7px] sm:text-[8px] lg:text-[9px] tracking-tight leading-[125%] text-[#97E600] font-mono select-none whitespace-pre self-end text-right relative -mt-2 sm:-mt-3 lg:-mt-3.5 z-10">
              {`███╗   ███╗ ██████╗ ███╗   ██╗███████╗██╗   ██╗
████╗ ████║██╔═══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██╔████╔██║██║   ██║██╔██╗ ██║█████╗   ╚████╔╝ 
██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══╝    ╚██╔╝  
██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████╗   ██║   
╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   `}
            </pre>
          </div>
        </div>

        {/* Row 1 Right: Taglines */}
        <div className="flex flex-col justify-start py-1">
          <p className="text-sm sm:text-base lg:text-[23px] tracking-tight text-white font-mono font-medium uppercase whitespace-nowrap">
            The Market Layer for AI Execution
          </p>
          <p className="text-sm sm:text-base lg:text-lg tracking-tight text-neutral-400 font-mono font-medium uppercase mt-1">
            Price. Package. Trade.
          </p>
        </div>

        {/* Row 2 Left: For Sellers */}
        <div>
          <h2 className="text-sm font-mono font-medium tracking-wider text-white uppercase mb-3 text-left">
            For sellers
          </h2>
          <div
            onClick={handleCopy}
            className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-colors rounded-lg px-4 h-16 font-mono text-sm text-white flex items-center justify-between gap-4 w-full cursor-pointer group"
          >
            <code className="truncate relative flex items-center text-[#97E600] font-medium">
              <span className={copied ? "opacity-0" : "opacity-100 transition-opacity"}>
                Copy prompt to start selling
              </span>
              {copied && (
                <span className="absolute inset-0 flex items-center text-[#97E600] font-medium">
                  Prompt copied!
                </span>
              )}
            </code>
            <button
              type="button"
              className="p-1.5 rounded text-neutral-400 group-hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="h-4 w-4 text-[#97E600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Row 2 Right: Works with these agents */}
        <div className="overflow-hidden min-w-0">
          <h2 className="text-sm font-mono font-medium tracking-wider text-white uppercase mb-3 text-left">
            Works with these agents
          </h2>
          <div className="relative w-full overflow-hidden h-16 flex items-center marquee-container">
            {/* Gradient Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            {/* Marquee Loop */}
            <div className="animate-marquee flex items-center">
              {[...AGENTS, ...AGENTS].map((agent, i) => (
                <Link
                  key={`${agent.slug}-${i}`}
                  href="/agents"
                  title={agent.name}
                  className="flex-shrink-0 px-4 opacity-75 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Image
                    src={agent.logo}
                    alt={agent.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain flex-shrink-0"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
