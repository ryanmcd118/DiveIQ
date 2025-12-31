"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { AvatarUploadModal } from "./AvatarUploadModal";
import styles from "./Avatar.module.css";

interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  fallbackImageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onAvatarUpdated?: (newUrl: string | null) => void;
}

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string
): string {
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
}

export function Avatar({
  firstName,
  lastName,
  avatarUrl,
  fallbackImageUrl,
  size = "md",
  editable = false,
  onAvatarUpdated,
}: AvatarProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const sizeClass =
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`];
  const initials = getInitials(firstName, lastName, session?.user?.email);

  // Use avatarUrl first, then fallbackImageUrl, then null
  const displayUrl = avatarUrl ?? fallbackImageUrl ?? null;
  const shouldShowImage = displayUrl && !imageError;

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[Avatar] avatarUrl:",
      avatarUrl,
      "fallbackImageUrl:",
      fallbackImageUrl,
      "displayUrl:",
      displayUrl,
      "shouldShowImage:",
      shouldShowImage
    );
  }

  const handleImageError = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Avatar] Image failed to load, falling back to initials");
    }
    setImageError(true);
  };

  const handlePencilClick = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Avatar] Pencil clicked, opening upload modal");
    }
    setShowUploadModal(true);
  };

  const handleUploadComplete = async (url: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Avatar] Upload complete, URL:", url);
    }

    try {
      // Update avatar URL in database
      const response = await fetch("/api/me/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update avatar");
      }

      // Update session with new avatarUrl (optional, for session consistency)
      await update({
        avatarUrl: url,
      });

      // Dispatch event to refresh /api/me in navbar components
      window.dispatchEvent(new Event("diveiq:me-updated"));

      // Refresh router to update UI (for server components)
      router.refresh();

      // Call callback if provided
      if (onAvatarUpdated) {
        onAvatarUpdated(url);
      }

      // Reset image error state for new image
      setImageError(false);
    } catch (error) {
      console.error("Error updating avatar:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update avatar";
      setUploadError(errorMessage);

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setUploadError(null);
      }, 5000);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    setIsUploading(false); // Clear loading state on error
    setUploadError(error.message || "Upload failed");
    setTimeout(() => {
      setUploadError(null);
    }, 5000);
  };

  const handleUploadBegin = () => {
    setIsUploading(true);
    setUploadError(null);
  };

  const handleModalClose = () => {
    setShowUploadModal(false);
    setIsUploading(false); // Clear loading state when modal closes
    setUploadError(null);
  };

  return (
    <div className={`${styles.avatarContainer} ${sizeClass}`}>
      {shouldShowImage ? (
        <img
          src={displayUrl || undefined}
          alt=""
          className={styles.avatarImage}
          onError={handleImageError}
        />
      ) : (
        <div className={styles.avatarInitials}>{initials}</div>
      )}

      {isUploading && (
        <div className={styles.uploadOverlay}>
          <div className={styles.uploadSpinner}></div>
        </div>
      )}

      {editable && !isUploading && (
        <button
          type="button"
          className={styles.editOverlay}
          onClick={handlePencilClick}
          aria-label="Edit avatar"
          title="Upload avatar"
        >
          <Pencil
            size={size === "sm" ? 12 : size === "md" ? 16 : 20}
            color="#ffffff"
          />
        </button>
      )}

      {uploadError && (
        <div className={styles.errorMessage} role="alert">
          {uploadError}
        </div>
      )}

      <AvatarUploadModal
        isOpen={showUploadModal}
        onClose={handleModalClose}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadBegin={handleUploadBegin}
      />
    </div>
  );
}
