"use client";

import { UserCertification } from "../types";
import cardStyles from "@/styles/components/Card.module.css";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./CertificationCard.module.css";
import { ChevronDown, Star, Edit, Trash2 } from "lucide-react";

interface Props {
  certification: UserCertification;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
}

export function CertificationCard({
  certification,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onToggleFeatured,
}: Props) {
  const def = certification.certificationDefinition;
  const earnedDate = certification.earnedDate
    ? new Date(certification.earnedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className={`${cardStyles.card} ${styles.card}`}>
      <div className={styles.cardHeader} onClick={onToggle}>
        <div className={styles.badgeContainer}>
          {def.badgeImageUrl ? (
            <img
              src={def.badgeImageUrl}
              alt={def.name}
              className={styles.badgeImage}
            />
          ) : (
            <div className={styles.badgePlaceholder}>
              <span className={styles.badgePlaceholderText}>
                {def.agency.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardTitle}>{def.name}</h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFeatured();
              }}
              className={`${styles.starButton} ${
                certification.isFeatured ? styles.starButtonActive : ""
              }`}
              aria-label={
                certification.isFeatured
                  ? "Remove from featured"
                  : "Add to featured"
              }
            >
              <Star
                size={18}
                fill={certification.isFeatured ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.agencyTag}>{def.agency}</span>
            {earnedDate ? (
              <span className={styles.earnedDate}>{earnedDate}</span>
            ) : (
              <span className={styles.earnedDateUnknown}>Date unknown</span>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ""}`}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.cardExpanded}>
          <div className={styles.cardDetails}>
            {certification.certNumber && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Certification number:</span>
                <span className={styles.detailValue}>{certification.certNumber}</span>
              </div>
            )}
            {certification.diveShop && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Dive shop:</span>
                <span className={styles.detailValue}>{certification.diveShop}</span>
              </div>
            )}
            {certification.location && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Location:</span>
                <span className={styles.detailValue}>{certification.location}</span>
              </div>
            )}
            {certification.instructor && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Instructor:</span>
                <span className={styles.detailValue}>{certification.instructor}</span>
              </div>
            )}
            {certification.notes && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Notes:</span>
                <span className={styles.detailValue}>{certification.notes}</span>
              </div>
            )}
          </div>

          <div className={styles.cardActions}>
            <button
              type="button"
              onClick={onEdit}
              className={buttonStyles.secondary}
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className={buttonStyles.danger}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

