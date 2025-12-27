import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/features/auth/components/SessionProvider";
import { AppShell } from "@/features/auth/components/AppShell";
import { UnitSystemProvider } from "@/contexts/UnitSystemContext";

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
        <SessionProvider>
          <UnitSystemProvider>
            <AppShell>{children}</AppShell>
          </UnitSystemProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
