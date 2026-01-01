"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UploadButton } from "@/components/UploadThingProvider";
import buttonStyles from "@/styles/components/Button.module.css";
import styles from "./AvatarUploadModal.module.css";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
  onUploadBegin: () => void;
}

export function AvatarUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  onUploadError,
  onUploadBegin,
}: AvatarUploadModalProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonInputRef = useRef<HTMLInputElement | null>(null);

  // Define handleClose with useCallback to ensure stable reference
  const handleClose = useCallback(() => {
    setIsUploading(false);
    setUploadError(null);
    onClose();
  }, [onClose]);

  // Find UploadButton input after render (async, can use regular effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      const uploadInput = document.querySelector(
        '[data-ut-element="button"] input[type="file"]'
      ) as HTMLInputElement;
      if (uploadInput) {
        uploadButtonInputRef.current = uploadInput;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Store the previous overflow value
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      // Restore the previous overflow value
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChooseFileClick = () => {
    if (isUploading) return;
    // Always use native file input for reliable picker
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      setUploadError("File size must be less than 4MB.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Clear any previous errors
    setUploadError(null);
    setIsUploading(true);
    onUploadBegin();

    // Transfer file to hidden UploadButton and trigger upload
    // This uses native input for picking (reliable) but UploadButton for upload (handles UploadThing API)
    setTimeout(() => {
      const uploadInput =
        uploadButtonInputRef.current ||
        (document.querySelector(
          '[data-ut-element="button"] input[type="file"]'
        ) as HTMLInputElement);

      if (uploadInput) {
        // Create FileList with our file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        uploadInput.files = dataTransfer.files;

        // Trigger change event to start upload
        const changeEvent = new Event("change", { bubbles: true });
        if (!isOpen) return null;

        uploadInput.dispatchEvent(changeEvent);
      } else {
        // Fallback error if UploadButton not ready
        setIsUploading(false);
        const error = new Error("Upload system not ready. Please try again.");
        setUploadError(error.message);
        onUploadError(error);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }, 50);
  };

  const handleUploadComplete = (res: { url: string }[]) => {
    setIsUploading(false);
    if (res && res.length > 0 && res[0]?.url) {
      onUploadComplete(res[0].url);
      handleClose();
    } else {
      const error = new Error("Upload failed: No file URL returned");
      setUploadError(error.message);
      onUploadError(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadError = (error: Error) => {
    setIsUploading(false);
    setUploadError(error.message || "Upload failed. Please try again.");
    onUploadError(error);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>Upload Avatar</h3>
          <button
            type="button"
            className={styles.closeXButton}
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {uploadError && (
            <div className={styles.errorMessage} role="alert">
              {uploadError}
            </div>
          )}

          <p className={styles.helperText}>Select an image (max 4MB)</p>

          <div className={styles.uploadArea}>
            {/* Native file input - always reliable for file picking */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={handleFileChange}
              disabled={isUploading}
              aria-label="Select image file"
            />
            {/* Styled button that triggers native input */}
            <button
              type="button"
              className={styles.chooseFileButton}
              onClick={handleChooseFileClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className={styles.spinner}></span>
                  Uploading...
                </>
              ) : (
                "Choose image…"
              )}
            </button>
            {/* Hidden UploadButton for actual upload handling */}
            <div className={styles.hiddenUploadButton}>
              <UploadButton
                endpoint="avatarUploader"
                onClientUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                onUploadBegin={() => {
                  // Already handled by handleFileChange
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleClose}
            className={buttonStyles.secondary}
            disabled={isUploading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
