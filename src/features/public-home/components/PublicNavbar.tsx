"use client";

import Link from "next/link";
import styles from "./PublicHomePage.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

interface PublicNavbarProps {
  variant?: "default" | "minimal";
}

export function PublicNavbar({ variant = "default" }: PublicNavbarProps) {
  const isMinimal = variant === "minimal";

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.navBrand}>
          Dive<span className={styles.navBrandAccent}>IQ</span>
        </Link>

        {!isMinimal && (
          <div className={styles.navLinks}>
            <Link href="/signin" className={styles.navLink}>
              Log in
            </Link>
            <Link href="/signup" className={styles.navLink}>
              Create account
            </Link>
            <Link href="/dive-plans" className={`${buttonStyles.primaryGradient} ${styles.navCta}`}>
              Start a Dive Plan →
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

