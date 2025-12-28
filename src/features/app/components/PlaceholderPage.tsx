"use client";

import Link from "next/link";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./PlaceholderPage.module.css";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  features?: string[];
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
}

export function PlaceholderPage({ 
  title, 
  subtitle, 
  features,
  primaryAction,
  secondaryAction 
}: PlaceholderPageProps) {
  return (
    <div className={styles.placeholderPage}>
      <div className={styles.content}>
        <div className={`${cardStyles.card} ${styles.card}`}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {features && features.length > 0 && (
            <div className={styles.features}>
              <h2 className={styles.featuresTitle}>Planned features:</h2>
              <ul className={styles.featuresList}>
                {features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={styles.actions}>
            {primaryAction && (
              <Link href={primaryAction.href} className={buttonStyles.primaryGradient}>
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link href={secondaryAction.href} className={buttonStyles.secondaryGradient}>
                {secondaryAction.label}
              </Link>
            )}
            {!primaryAction && !secondaryAction && (
              <Link href="/dashboard" className={buttonStyles.primaryGradient}>
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

