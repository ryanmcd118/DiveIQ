"use client";

import { useUnitSystem } from '@/contexts/UnitSystemContext';
import styles from './UnitToggle.module.css';

interface UnitToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function UnitToggle({ className, showLabel = true }: UnitToggleProps) {
  const { unitSystem, setUnitSystem } = useUnitSystem();

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {showLabel && <span className={styles.label}>Units</span>}
      <div className={styles.toggle} role="group" aria-label="Unit system">
        <button
          type="button"
          className={`${styles.segment} ${unitSystem === 'metric' ? styles.active : ''}`}
          onClick={() => setUnitSystem('metric')}
          aria-pressed={unitSystem === 'metric'}
          aria-label="Metric units"
        >
          Metric
        </button>
        <button
          type="button"
          className={`${styles.segment} ${unitSystem === 'imperial' ? styles.active : ''}`}
          onClick={() => setUnitSystem('imperial')}
          aria-pressed={unitSystem === 'imperial'}
          aria-label="Imperial units"
        >
          Imperial
        </button>
      </div>
    </div>
  );
}

