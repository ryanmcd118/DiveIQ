"use client";

import { PublicNavbar } from "@/features/public-home/components/PublicNavbar";
import styles from "./auth-layout.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavbar variant="minimal" />
      <div className={styles.container}>
        <div className={styles.section}>
          {children}
        </div>
      </div>
    </>
  );
}

