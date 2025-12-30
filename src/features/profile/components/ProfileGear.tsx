"use client";

import { useState, useEffect } from "react";
import styles from "./ProfileGear.module.css";

interface ProfileKitItem {
  id: string;
  manufacturer: string;
  model: string;
  purchaseDate: string | null;
}

interface ProfileKit {
  id: string;
  name: string;
  items: ProfileKitItem[];
}

interface ProfileData {
  showGearOnProfile: boolean;
  profileKits: ProfileKit[];
  profileKitIds: string[];
}

export function ProfileGear() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          const kits = data.user.profileKits || [];
          const kitIds = data.user.profileKitIds || [];
          
          // Only set data if showGearOnProfile is true AND there are selected kits
          if (data.user.showGearOnProfile && kitIds.length > 0 && kits.length > 0) {
            setProfileData({
              showGearOnProfile: true,
              profileKits: kits,
              profileKitIds: kitIds,
            });
          } else {
            setProfileData({
              showGearOnProfile: data.user.showGearOnProfile ?? false,
              profileKits: [],
              profileKitIds: [],
            });
          }
        }
      } catch (err) {
        console.error("Failed to load gear data", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  // Section gating: don't render if showGearOnProfile is false or no kits selected
  if (loading) {
    return null; // Don't show loading state, just don't render
  }

  if (!profileData) {
    return null;
  }

  if (!profileData.showGearOnProfile) {
    return null;
  }

  if (!profileData.profileKits || profileData.profileKits.length === 0) {
    return null; // No placeholder for MVP
  }

  // Filter to only show kits that are in profileKitIds (defensive check)
  const selectedKits = profileData.profileKits.filter((kit) =>
    profileData.profileKitIds.includes(kit.id)
  );

  if (selectedKits.length === 0) {
    return null;
  }

  const formatPurchaseDate = (dateString: string | null): string | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.getFullYear().toString();
    } catch {
      return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.subheader}>Shared kits</div>
      
      <div className={styles.kitsGrid}>
        {selectedKits.map((kit) => {
          const itemCount = kit.items?.length || 0;
          const visibleItems = kit.items?.slice(0, 6) || [];
          const remainingCount = itemCount - visibleItems.length;

          return (
            <div key={kit.id} className={styles.kitCard}>
              <div className={styles.kitHeader}>
                <div className={styles.kitName}>{kit.name}</div>
                <div className={styles.kitItemCount}>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </div>
              </div>
              
              {itemCount > 0 && (
                <>
                  <div className={styles.divider}></div>
                  <ul className={styles.itemsList}>
                    {visibleItems.map((item) => {
                      const purchaseYear = item.purchaseDate
                        ? formatPurchaseDate(item.purchaseDate)
                        : null;

                      return (
                        <li key={item.id} className={styles.itemRow}>
                          <div className={styles.itemName}>
                            <span className={styles.itemManufacturer}>
                              {item.manufacturer}
                            </span>
                            <span className={styles.itemSeparator}>·</span>
                            <span className={styles.itemModel}>
                              {item.model}
                            </span>
                            {purchaseYear && (
                              <span className={styles.itemYear}>
                                {" "}({purchaseYear})
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                    {remainingCount > 0 && (
                      <li className={styles.moreItems}>
                        +{remainingCount} more items
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

