"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import AuthNav from "./AuthNav";
import navStyles from "@/styles/components/Navigation.module.css";
import layoutStyles from "@/styles/components/Layout.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // On the homepage ("/"), if user is not authenticated, 
  // render children directly (PublicHomePage has its own nav)
  const isHomePage = pathname === "/";
  const showPublicHome = isHomePage && !isAuthenticated && !isLoading;

  if (showPublicHome) {
    return <>{children}</>;
  }

  // For all other pages, or authenticated users, show the app shell
  return (
    <>
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
          <AuthNav />
        </nav>
      </header>

      {/* Page content */}
      <main className={layoutStyles.main}>{children}</main>
    </>
  );
}

