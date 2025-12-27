"use client";

import { useEffect } from "react";
import Image from "next/image";
import { PublicNavbar } from "@/features/public-home/components/PublicNavbar";
import styles from "./auth-layout.module.css";

export function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Disable body scroll only on auth pages
  useEffect(() => {
    // Store original overflow value
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;

    // Apply no-scroll styles
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";

    // Cleanup on unmount - restore original values
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  return (
    <>
      <PublicNavbar variant="minimal" />
      <div className={styles.container}>
        <Image
          src="/signin-background.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center right",
          }}
          className={styles.backgroundImage}
        />
        <div className={styles.overlay} />
        <div className={styles.section}>
          {children}
        </div>
      </div>
    </>
  );
}

