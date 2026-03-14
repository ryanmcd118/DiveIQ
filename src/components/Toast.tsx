"use client";

import { useEffect, useRef } from "react";
import gridStyles from "@/styles/components/PageGrid.module.css";
import buttonStyles from "@/styles/components/Button.module.css";

interface ToastProps {
  message: string;
  onUndo?: () => void;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  onUndo,
  onClose,
  duration = 5000,
}: ToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Timer fires once on mount. onCloseRef keeps the callback current without
  // restarting the timer on re-renders.
  useEffect(
    () => {
      if (onUndo) return;
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, duration);
      return () => clearTimeout(timer);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className={gridStyles.statusToast}>
      <div className={gridStyles.statusToastContent}>
        <span style={{ fontSize: "var(--font-size-lg)" }}>✅</span>
        <span>{message}</span>
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className={buttonStyles.ghost}
            style={{
              marginLeft: "var(--space-2)",
              padding: "var(--space-1) var(--space-2)",
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
