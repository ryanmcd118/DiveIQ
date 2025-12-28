"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import styles from "./DashboardHeader.module.css";

interface DashboardHeaderProps {
  totalDives: number;
  totalBottomTime: number;
  lastDiveDate?: string;
  divesThisMonth?: number;
}

export function DashboardHeader({
  totalDives,
  totalBottomTime,
  lastDiveDate,
  divesThisMonth = 0,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const firstName = user?.firstName;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const subtextParts = [];
  if (totalDives > 0) {
    subtextParts.push(
      `${totalDives} dive${totalDives === 1 ? "" : "s"} logged`
    );
    subtextParts.push(`${totalBottomTime} min bottom time`);
    if (lastDiveDate) {
      subtextParts.push(`Last dive ${lastDiveDate}`);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.heroContent}>
          <h1 className={styles.greeting}>
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          {divesThisMonth > 0 && (
            <span className={styles.statusPill}>
              {divesThisMonth} dive{divesThisMonth === 1 ? "" : "s"} this month
            </span>
          )}
        </div>
        {subtextParts.length > 0 ? (
          <p className={styles.subtext}>{subtextParts.join(" · ")}</p>
        ) : (
          <p className={styles.subtext}>
            Start logging your dives to see your stats here
          </p>
        )}
      </div>
    </header>
  );
}
