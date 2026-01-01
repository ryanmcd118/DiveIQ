"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Check sidebar collapsed state from localStorage
    const updateCollapsed = () => {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    };
    updateCollapsed();

    // Listen for custom event from Sidebar
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarCollapsed(e.detail.collapsed);
    };
    window.addEventListener(
      "sidebarToggle",
      handleSidebarToggle as EventListener
    );

    return () => {
      window.removeEventListener(
        "sidebarToggle",
        handleSidebarToggle as EventListener
      );
    };
  }, []);

  // AppShell is only used in (app) route group, so always render sidebar/topbar
  return (
    <div className={styles.appShell}>
      <Sidebar
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />
      <div
        className={`${styles.mainContent} ${
          isSidebarCollapsed && !isMobile ? styles.sidebarCollapsed : ""
        }`}
      >
        <TopBar onMenuClick={() => setIsMobileOpen(!isMobileOpen)} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
