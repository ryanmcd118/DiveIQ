"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { NavbarUnitToggle } from "@/components/NavbarUnitToggle";
import styles from "./TopBar.module.css";

interface TopBarProps {
  onMenuClick?: () => void;
}

const ALLOWED_UNITS_TOGGLE_PATHS = ["/dashboard", "/plan", "/dive-logs"];

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, signOutUser } = useAuth();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showUnitsToggle = ALLOWED_UNITS_TOGGLE_PATHS.includes(pathname);
  const firstName = user?.name?.split(" ")[0] || user?.name || "User";
  const initials = firstName.charAt(0).toUpperCase();

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        {isMobile && onMenuClick && (
          <button
            className={styles.menuButton}
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
        )}
      </div>

      <div className={styles.right}>
        {showUnitsToggle && <NavbarUnitToggle />}
        <div className={styles.profileContainer}>
          <button
            className={styles.profileButton}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="Profile menu"
          >
            <div className={styles.avatar}>{initials}</div>
          </button>
          {showProfileMenu && (
            <>
              <div
                className={styles.overlay}
                onClick={() => setShowProfileMenu(false)}
              />
              <div className={styles.profileMenu}>
                <div className={styles.profileMenuHeader}>
                  <div className={styles.avatar}>{initials}</div>
                  <div>
                    <div className={styles.profileName}>{user?.name || "User"}</div>
                    <div className={styles.profileEmail}>{user?.email}</div>
                  </div>
                </div>
                <div className={styles.profileMenuDivider} />
                <Link
                  href="/settings"
                  className={styles.profileMenuItem}
                  onClick={() => setShowProfileMenu(false)}
                >
                  <SettingsIcon />
                  <span>Account</span>
                </Link>
                <Link
                  href="/settings"
                  className={styles.profileMenuItem}
                  onClick={() => setShowProfileMenu(false)}
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </Link>
                <div className={styles.profileMenuDivider} />
                <button
                  className={styles.profileMenuItem}
                  onClick={() => {
                    setShowProfileMenu(false);
                    signOutUser();
                  }}
                >
                  <SignOutIcon />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M8 2v2M8 12v2M14 8h-2M4 8H2M12.66 3.34l-1.41 1.41M5.75 11.25l-1.41 1.41M12.66 12.66l-1.41-1.41M5.75 5.75l-1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l4-4M14 7l-4-4M10 7H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

