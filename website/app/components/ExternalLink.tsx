import type { ReactNode } from "react";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
};

export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline decoration-emerald-600/30 dark:decoration-emerald-400/30 hover:decoration-emerald-700 dark:hover:decoration-emerald-300 underline-offset-2 decoration-1 transition-all"
    >
      {children}
    </a>
  );
}
