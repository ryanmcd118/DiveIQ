"use client";

import Link from "next/link";
import styles from "./PublicHomePage.module.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <p className={styles.footerCopy}>
          © {currentYear} DiveIQ. All rights reserved.
        </p>
        <div className={styles.footerLinks}>
          <Link href="#" className={styles.footerLink}>
            About
          </Link>
          <Link href="#" className={styles.footerLink}>
            Privacy
          </Link>
          <Link href="#" className={styles.footerLink}>
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

