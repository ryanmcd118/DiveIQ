"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMe } from "@/features/auth/hooks/useMe";
import { Avatar } from "@/components/Avatar/Avatar";
import { NavbarUnitToggle } from "@/components/NavbarUnitToggle";
import styles from "./TopBar.module.css";

interface TopBarProps {
  onMenuClick?: () => void;
}

const ALLOWED_UNITS_TOGGLE_PATHS = ["/dashboard", "/plan", "/dive-logs"];

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession();
  const { user, signOutUser } = useAuth();
  const { me } = useMe();
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
  const firstName = me?.firstName ?? user?.firstName ?? "User";
  const displayName = (me?.firstName && me?.lastName)
    ? `${me.firstName} ${me.lastName}`
    : me?.firstName ?? user?.firstName ?? "User";
  
  // Use DB-fresh avatarUrl from /api/me, fallback to session.user.image for OAuth users
  const avatarUrl = me?.avatarUrl ?? null;
  const fallbackImageUrl = session?.user?.image ?? me?.image ?? null;

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
            <Avatar
              firstName={me?.firstName ?? user?.firstName ?? null}
              lastName={me?.lastName ?? user?.lastName ?? null}
              avatarUrl={avatarUrl}
              fallbackImageUrl={fallbackImageUrl}
              size="sm"
              editable={false}
            />
          </button>
          {showProfileMenu && (
            <>
              <div
                className={styles.overlay}
                onClick={() => setShowProfileMenu(false)}
              />
              <div className={styles.profileMenu}>
                <div className={styles.profileMenuHeader}>
                  <Avatar
                    firstName={me?.firstName ?? user?.firstName ?? null}
                    lastName={me?.lastName ?? user?.lastName ?? null}
                    avatarUrl={avatarUrl}
                    fallbackImageUrl={fallbackImageUrl}
                    size="md"
                    editable={false}
                  />
                  <div>
                    <div className={styles.profileName}>{displayName}</div>
                    <div className={styles.profileEmail}>{me?.email ?? user?.email}</div>
                  </div>
                </div>
                <div className={styles.profileMenuDivider} />
                <Link
                  href="/profile"
                  className={styles.profileMenuItem}
                  onClick={() => setShowProfileMenu(false)}
                >
                  <ProfileIcon />
                  <span>Profile</span>
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

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M3 14c0-2.761 2.239-5 5-5s5 2.239 5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
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

