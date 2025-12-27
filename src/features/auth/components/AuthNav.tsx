"use client";

import { useAuth } from "../hooks/useAuth";
import Link from "next/link";
import { NavbarUnitToggle } from "@/components/NavbarUnitToggle";
import navStyles from "@/styles/components/Navigation.module.css";
import styles from "./AuthNav.module.css";

export default function AuthNav() {
  const { user, isAuthenticated, isLoading, signOutUser } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.authSection}>
        <span className={navStyles.link}>Loading...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Extract first name from user.name
    const firstName = user.name?.split(" ")[0] || user.name || "User";

    return (
      <div className={styles.authSection}>
        <NavbarUnitToggle />
        <span className={styles.greeting}>Hi, {firstName}</span>
        <button onClick={signOutUser} className={styles.signOutButton}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className={styles.authSection}>
      <Link href="/signin" className={styles.authLink}>
        Log in / Sign up
      </Link>
    </div>
  );
}


