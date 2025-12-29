"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "../hooks/useAuth";
import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import { NavbarUnitToggle } from "@/components/NavbarUnitToggle";
import { NavbarUnitToggleLocal } from "@/components/NavbarUnitToggleLocal";
import navStyles from "@/styles/components/Navigation.module.css";
import styles from "./AuthNav.module.css";

export default function AuthNav() {
  const { data: session } = useSession();
  const { user, isAuthenticated, isLoading, signOutUser } = useAuth();
  const pathname = usePathname();
  const isDivePlansPage = pathname === '/dive-plans';

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[AuthNav] session.user.avatarUrl:', session?.user?.avatarUrl);
    console.log('[AuthNav] session.user.image:', session?.user?.image);
    console.log('[AuthNav] user.avatarUrl:', user?.avatarUrl);
    console.log('[AuthNav] user.image:', user?.image);
  }

  if (isLoading) {
    return (
      <div className={styles.authSection}>
        <span className={navStyles.link}>Loading...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const firstName = user.firstName || "User";
    // Use session directly for avatarUrl to ensure it updates immediately
    const avatarUrl = session?.user?.avatarUrl ?? user?.avatarUrl ?? null;
    const fallbackImageUrl = session?.user?.image ?? user?.image ?? null;

    return (
      <div className={styles.authSection}>
        <NavbarUnitToggle />
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          avatarUrl={avatarUrl}
          fallbackImageUrl={fallbackImageUrl}
          size="sm"
          editable={false}
        />
        <span className={styles.greeting}>Hi, {firstName}</span>
        <button onClick={signOutUser} className={styles.signOutButton}>
          Sign out
        </button>
      </div>
    );
  }

  // Logged-out users: show unit toggle on /dive-plans page
  return (
    <div className={styles.authSection}>
      {isDivePlansPage && <NavbarUnitToggleLocal />}
      <Link href="/signin" className={styles.authLink}>
        Log in / Sign up
      </Link>
    </div>
  );
}


