"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "../hooks/useAuth";
import { useMe } from "../hooks/useMe";
import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import { NavbarUnitToggle } from "@/components/NavbarUnitToggle";
import { NavbarUnitToggleLocal } from "@/components/NavbarUnitToggleLocal";
import navStyles from "@/styles/components/Navigation.module.css";
import styles from "./AuthNav.module.css";

export default function AuthNav() {
  const { data: session } = useSession();
  const { user, isAuthenticated, isLoading, signOutUser } = useAuth();
  const { me } = useMe();
  const pathname = usePathname();
  const isDivePlansPage = pathname === '/dive-plans';

  if (isLoading) {
    return (
      <div className={styles.authSection}>
        <span className={navStyles.link}>Loading...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const firstName = me?.firstName ?? user.firstName ?? "User";
    // Use DB-fresh avatarUrl from /api/me, fallback to session.user.image for OAuth users
    const avatarUrl = me?.avatarUrl ?? null;
    const fallbackImageUrl = session?.user?.image ?? me?.image ?? null;

    return (
      <div className={styles.authSection}>
        <NavbarUnitToggle />
        <Avatar
          firstName={me?.firstName ?? user.firstName ?? null}
          lastName={me?.lastName ?? user.lastName ?? null}
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


