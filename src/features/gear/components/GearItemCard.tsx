"use client";

import type { GearItem } from "@prisma/client";
import {
  computeMaintenanceStatus,
  getNextServiceDueAt,
  type MaintenanceStatus,
} from "../lib/maintenance";
import { type GearType, formatGearTypeLabel } from "../constants";
import {
  getPrimaryTitle,
  getSecondaryText,
  getStatusLabel,
  formatDate,
} from "../lib/gearListHelpers";
import styles from "./GearItemCard.module.css";

interface GearItemCardProps {
  item: GearItem;
  kitNames: string[];
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (item: GearItem) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  cardRef: (el: HTMLLIElement | null) => void;
}

function getStatusClass(status: MaintenanceStatus): string {
  switch (status) {
    case "OVERDUE":
      return styles.statusOverdue;
    case "DUE_SOON":
      return styles.statusDueSoon;
    case "UP_TO_DATE":
      return styles.statusUpToDate;
    case "UNKNOWN":
      return styles.statusUnknown;
    case "NO_SCHEDULE":
      return styles.statusNoSchedule;
    default:
      return "";
  }
}

export function GearItemCard({
  item,
  kitNames,
  isExpanded,
  isHighlighted,
  onToggleExpand,
  onEdit,
  onArchive,
  onDelete,
  cardRef,
}: GearItemCardProps) {
  const status = computeMaintenanceStatus(item);
  const nextDue = getNextServiceDueAt(item);

  const primaryTitle = getPrimaryTitle(item);
  const secondaryText = getSecondaryText(item);

  const hasExpandedContent =
    item.purchaseDate || item.notes || item.serviceIntervalMonths;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest(`.${styles.itemActionsTop}`) ||
      target.closest(`.${styles.itemRight}`) ||
      target.closest(`button`) ||
      target.closest(`svg`)
    ) {
      return;
    }
    if (hasExpandedContent) {
      onToggleExpand(item.id);
    }
  };

  return (
    <li
      ref={cardRef}
      className={`${styles.item} ${isExpanded ? styles.itemExpanded : ""} ${
        hasExpandedContent ? styles.itemExpandable : ""
      } ${isHighlighted ? styles.itemHighlighted : ""}`}
      onClick={hasExpandedContent ? handleCardClick : undefined}
    >
      <div className={styles.itemContent}>
        {/* Row 1: Title (always present) */}
        <div className={styles.itemTitleRow}>
          <span className={styles.itemName}>{primaryTitle}</span>
        </div>

        {/* Row 2: Subtitle (nickname) - always reserves space */}
        <div className={styles.subtitleRow}>
          <span className={styles.itemNickname} aria-hidden={!secondaryText}>
            {secondaryText || "\u00A0"}
          </span>
        </div>

        {/* Row 3: Meta line (type + last serviced + due) - always present */}
        <div className={styles.itemMeta}>
          <span className={styles.itemType}>
            {formatGearTypeLabel(item.type as GearType)}
          </span>
          {item.lastServicedAt && (
            <span className={styles.itemMetaText}>
              Last serviced: {formatDate(item.lastServicedAt)}
            </span>
          )}
          {nextDue && (
            <span className={styles.itemMetaText}>
              Due: {formatDate(nextDue)}
            </span>
          )}
        </div>

        {/* Row 4: Kit pills - always reserves space */}
        <div className={styles.kitsRow}>
          {kitNames.length > 0 ? (
            <div className={styles.kitPills}>
              {kitNames.map((kitName) => (
                <span key={kitName} className={styles.kitPill}>
                  {kitName}
                </span>
              ))}
            </div>
          ) : (
            <span className={styles.kitPillEmpty}>No kits</span>
          )}
        </div>
        {isExpanded && hasExpandedContent && (
          <div className={styles.itemExpandedContent}>
            {item.purchaseDate && (
              <div className={styles.itemExpandedRow}>
                <span className={styles.itemExpandedLabel}>Purchased:</span>
                <span className={styles.itemExpandedValue}>
                  {formatDate(item.purchaseDate)}
                </span>
              </div>
            )}
            {item.serviceIntervalMonths && (
              <div className={styles.itemExpandedRow}>
                <span className={styles.itemExpandedLabel}>
                  Service interval:
                </span>
                <span className={styles.itemExpandedValue}>
                  {item.serviceIntervalMonths} month
                  {item.serviceIntervalMonths !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {item.notes && (
              <div className={styles.itemExpandedRow}>
                <span className={styles.itemExpandedLabel}>Notes:</span>
                <span className={styles.itemExpandedValue}>{item.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.itemRight} onClick={(e) => e.stopPropagation()}>
        {/* Top-right: Edit, Archive, and Delete icons */}
        <div className={styles.itemActionsTop}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className={styles.iconButton}
            title="Edit gear"
            type="button"
            aria-label="Edit gear"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 2.5L11.5 5.5M10.5 1.5C10.8978 1.10218 11.4374 0.878679 12 0.878679C12.5626 0.878679 13.1022 1.10218 13.5 1.5C13.8978 1.89782 14.1213 2.43739 14.1213 3C14.1213 3.56261 13.8978 4.10218 13.5 4.5L4.5 13.5H0.5V9.5L9.5 0.5C9.89782 0.102178 10.4374 -0.121323 11 -0.121323C11.5626 -0.121323 12.1022 0.102178 12.5 0.5L10.5 1.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(item.id);
            }}
            className={styles.iconButton}
            title={item.isActive ? "Archive gear" : "Restore gear"}
            type="button"
            aria-label={item.isActive ? "Archive gear" : "Restore gear"}
          >
            {item.isActive ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V11.5C12.5 12.0523 12.0523 12.5 11.5 12.5H2.5C1.94772 12.5 1.5 12.0523 1.5 11.5V3.5C1.5 2.94772 1.94772 2.5 2.5 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 5.5H8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V11.5C12.5 12.0523 12.0523 12.5 11.5 12.5H2.5C1.94772 12.5 1.5 12.0523 1.5 11.5V3.5C1.5 2.94772 1.94772 2.5 2.5 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 5.5L7 7L8.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
            title="Delete gear"
            type="button"
            aria-label="Delete gear"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 3.5L10.5 11.5C10.5 12.0523 10.0523 12.5 9.5 12.5H4.5C3.94772 12.5 3.5 12.0523 3.5 11.5L3 3.5M5.5 3.5V2.5C5.5 1.94772 5.94772 1.5 6.5 1.5H7.5C8.05228 1.5 8.5 1.94772 8.5 2.5V3.5M1.5 3.5H12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Bottom-right: Status pills */}
        <div className={styles.statusPills}>
          <span className={`${styles.statusPill} ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
          </span>
          {!item.isActive && (
            <span className={`${styles.statusPill} ${styles.statusInactive}`}>
              Inactive
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
