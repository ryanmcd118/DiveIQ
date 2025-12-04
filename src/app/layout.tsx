import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import navStyles from "@/styles/components/Navigation.module.css";
import layoutStyles from "@/styles/components/Layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DiveIQ",
  description:
    "Plan, log, and understand your dives with AI-assisted guidance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Top nav */}
        <header className={navStyles.header}>
          <nav className={navStyles.nav}>
            <Link href="/" className={navStyles.brand}>
              <span className={navStyles.logo}>DiveIQ</span>
            </Link>
            <div className={navStyles.links}>
              <Link href="/" className={navStyles.link}>
                Dashboard
              </Link>
              <Link href="/dive-plans" className={navStyles.link}>
                Plan
              </Link>
              <Link href="/dive-logs" className={navStyles.link}>
                Log
              </Link>
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className={layoutStyles.main}>{children}</main>
      </body>
    </html>
  );
}
