"use client";

import { useState } from "react";

const AGENTS = [
  { name: "Strands Agents", slug: "strands-agents" },
  { name: "Mastra", slug: "mastra" },
  { name: "Claude Agent", slug: "claude-agent" },
  { name: "Google ADK", slug: "google-adk" },
  { name: "LangChain", slug: "langchain" },
  { name: "OpenAI Agents", slug: "openai-agents" },
];

export function HeroSection() {
  const [copied, setCopied] = useState(false);
  const commandText = "npx skills add <owner/repo>";

  const handleCopy = () => {
    navigator.clipboard.writeText("One prompt to cashflow");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-6 sm:py-8 lg:py-10 border-b border-neutral-900">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Left Column: ASCII Banner & Tagline */}
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
              {`███╗   ███╗██████╗ ███╗   ██╗███████╗██╗   ██╗
████╗ ████║██╔══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██╔████╔██║██║  ██║██╔██╗ ██║█████╗   ╚████╔╝ 
██║╚██╔╝██║██║  ██║██║╚██╗██║██╔══╝    ╚██╔╝  
██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████╗  ██║   
╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝  ╚═╝   `}
            </pre>
          </div>

          <p className="text-sm sm:text-base lg:text-lg tracking-tight text-white font-mono font-medium uppercase">
            Context. Traces. Logs. Cashflow
          </p>
        </div>

        {/* Right Column: Intro text */}
        <div className="flex flex-col justify-between py-1">
          <p className="text-neutral-400 text-lg sm:text-2xl lg:text-3xl leading-snug tracking-tight text-balance">
            Everyone says AI runs on data.<br /> But every AI execution has value. <br />We're building the infrastructure to trade it.
          </p>
        </div>
      </div>

      {/* Sellers & Agents 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
        {/* Left Column: For Sellers */}
        <div>
          <h2 className="text-xs font-mono font-medium tracking-wider text-white uppercase mb-3 text-left">
            For sellers
          </h2>
          <div
            onClick={handleCopy}
            className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-colors rounded-lg px-4 py-3 font-mono text-sm text-white flex items-center justify-between gap-4 w-full cursor-pointer group"
          >
            <code className="truncate flex items-center text-[#97E600] font-medium">
              One prompt to cashflow
            </code>
            <button
              type="button"
              className="p-1.5 rounded text-neutral-400 group-hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Right Column: Available For These Agents */}
        <div className="overflow-hidden">
          <h2 className="text-xs font-mono font-medium tracking-wider text-white uppercase mb-3 text-left">
            Available for these agents
          </h2>
          <div className="relative w-full overflow-hidden py-1">
            {/* Gradient Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            {/* Marquee Loop */}
            <div className="animate-marquee flex gap-3">
              {[...AGENTS, ...AGENTS].map((agent, i) => (
                <div
                  key={`${agent.slug}-${i}`}
                  className="flex-shrink-0 px-3 py-2 bg-neutral-900/60 border border-neutral-800/80 rounded-md text-xs font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-[#97E600] animate-pulse" />
                  <span>{agent.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
