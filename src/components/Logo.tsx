import type { SVGProps } from 'react';
import Link from 'next/link';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Local Hive">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-primary"
        {...props}
      >
        {/* Location Pin */}
        <path d="M12 2C8.13 2 5 5.13 5 9c0 4.87 7 13 7 13s7-8.13 7-13c0-3.87-3.13-7-7-7z" />
        {/* Book (symbolizing learning) */}
        <path d="M9 9h6M9 12h6" />
        {/* Spark (symbol of idea/lightbulb moment) */}
        <path d="M12 6v.01" />
      </svg>
      <span className="text-xl font-semibold text-foreground">Local Hive</span>
    </Link>
  );
}