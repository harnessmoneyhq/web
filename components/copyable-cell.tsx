"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";

export function CopyableCell({
    value,
    label,
    href,
    variant = "default",
}: {
    value: string;
    label?: string;
    href?: string;
    /** "default" uses neutral-300/400 text, "bright" uses white text (used on transactions page) */
    variant?: "default" | "bright";
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [value]);

    const isInternal = href?.startsWith("/");

    const internalLinkClass = variant === "bright"
        ? "hover:text-[#97E600] text-white transition-colors font-mono"
        : "hover:text-[#97E600] text-neutral-300 transition-colors font-mono text-xs font-medium";

    const externalLinkClass = variant === "bright"
        ? "hover:text-[#97E600] text-white transition-colors font-mono"
        : "hover:text-[#97E600] text-neutral-400 transition-colors font-mono text-xs";

    const plainTextClass = variant === "bright"
        ? "font-mono text-white"
        : "font-mono text-xs text-neutral-400";

    return (
        <span className="inline-flex items-center gap-1.5">
            {href ? (
                isInternal ? (
                    <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className={internalLinkClass}
                    >
                        {label ?? value}
                    </Link>
                ) : (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={externalLinkClass}
                    >
                        {label ?? value}
                    </a>
                )
            ) : (
                <span className={plainTextClass}>{label ?? value}</span>
            )}

            <button
                type="button"
                onClick={handleCopy}
                title={copied ? "Copied!" : "Copy"}
                className="text-neutral-600 hover:text-neutral-300 transition-colors cursor-pointer p-0.5 rounded"
            >
                {copied ? (
                    <Check size={12} className="text-[#97E600]" />
                ) : (
                    <Copy size={11} />
                )}
            </button>
        </span>
    );
}
