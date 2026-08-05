import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-neutral-900 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
        <p>
          © {new Date().getFullYear()}{" "}
          <a
            href="https://www.ivanmolto.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            Ivan Molto
          </a>{" "}
          • Built with ♥ from sunny Malta
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span>Built with</span>
              <a
                href="https://www.arc.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/arc/arc-logo-white.svg"
                  alt="Arc"
                  width={40}
                  height={14}
                  style={{ height: "14px", width: "auto" }}
                  className="h-3.5 w-auto object-contain"
                />
              </a>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span>Supports</span>
              <a
                href="https://www.circle.com/usdc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/usdc/usdc-lockup.svg"
                  alt="USDC"
                  width={48}
                  height={14}
                  style={{ height: "14px", width: "auto" }}
                  className="h-3.5 w-auto object-contain brightness-0 invert"
                />
              </a>
            </span>
          </div>
          <a
            href="https://github.com/harnessmoneyhq"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
