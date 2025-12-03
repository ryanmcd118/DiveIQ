import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DiveIQ',
  description:
    'Plan, log, and understand your dives with AI-assisted guidance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        {/* Top nav */}
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950">
          <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-slate-100">
                DiveIQ
              </span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="text-slate-300 hover:text-cyan-300 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/plan"
                className="text-slate-300 hover:text-cyan-300 transition-colors"
              >
                Plan
              </Link>
              <Link
                href="/log"
                className="text-slate-300 hover:text-cyan-300 transition-colors"
              >
                Log
              </Link>
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="pt-4">{children}</main>
      </body>
    </html>
  );
}
