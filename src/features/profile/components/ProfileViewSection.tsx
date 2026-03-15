"use client";

import { Avatar } from "@/components/Avatar/Avatar";
import type { ProfileData } from "../types";
import { displayWebsiteUrl, formatBirthday } from "../utils/profileUtils";
import { ProfileCertifications } from "./ProfileCertifications";
import { ProfileGear } from "./ProfileGear";
import styles from "./ProfileViewSection.module.css";

interface Props {
  draftProfile: ProfileData;
  displayName: string;
  authUserImage: string | null;
}

export function ProfileViewSection({
  draftProfile,
  displayName,
  authUserImage,
}: Props) {
  const fullName =
    [draftProfile.firstName, draftProfile.lastName].filter(Boolean).join(" ") ||
    displayName;

  // Build metadata line: Location, Home Dive Region, Experience Level
  const metadataParts: string[] = [];
  if (draftProfile.location) metadataParts.push(draftProfile.location);
  if (draftProfile.homeDiveRegion)
    metadataParts.push(draftProfile.homeDiveRegion);
  if (draftProfile.experienceLevel)
    metadataParts.push(draftProfile.experienceLevel);
  const metadata = metadataParts.join(" · ");

  const primaryDiveTypes = draftProfile.primaryDiveTypes || [];

  // Check if sections have content
  const hasBasicInfo = !!(
    draftProfile.bio ||
    draftProfile.birthday ||
    draftProfile.languages ||
    draftProfile.website
  );
  const hasDivingProfile =
    !!(
      draftProfile.yearsDiving !== null &&
      draftProfile.yearsDiving !== undefined
    ) ||
    !!draftProfile.certifyingAgency ||
    (draftProfile.typicalDivingEnvironment &&
      draftProfile.typicalDivingEnvironment.length > 0) ||
    !!draftProfile.favoriteDiveLocation ||
    (draftProfile.lookingFor && draftProfile.lookingFor.length > 0);

  return (
    <>
      {/* Header / Overview */}
      <div className={styles.previewHeader}>
        <Avatar
          firstName={draftProfile.firstName}
          lastName={draftProfile.lastName}
          avatarUrl={draftProfile.avatarUrl}
          fallbackImageUrl={authUserImage}
          size="md"
          editable={false}
        />
        <div className={styles.previewInfo}>
          <div className={styles.nameRow}>
            <h2 className={styles.fullName}>{fullName}</h2>
            {draftProfile.pronouns && (
              <span className={styles.previewPronouns}>
                {draftProfile.pronouns}
              </span>
            )}
          </div>
          {metadata && <p className={styles.previewSubtitle}>{metadata}</p>}
          {primaryDiveTypes.length > 0 && (
            <div className={styles.previewTags}>
              {primaryDiveTypes.map((tag) => (
                <span key={tag} className={styles.previewTag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.previewDivider}></div>

      {/* Section: Basic Info */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Basic Info</h3>
        {!hasBasicInfo ? (
          <p className={styles.emptyState}>
            This user hasn&apos;t shared basic personal details yet.
          </p>
        ) : (
          <div className={styles.previewTiles}>
            {draftProfile.bio && (
              <div
                className={styles.previewTile}
                style={{ gridColumn: "1 / -1" }}
              >
                <div className={styles.previewTileLabel}>About</div>
                <div className={styles.previewBioText}>{draftProfile.bio}</div>
              </div>
            )}
            {draftProfile.birthday && (
              <div className={styles.previewTile}>
                <div className={styles.previewTileLabel}>Birthday</div>
                <div className={styles.previewTileValue}>
                  {formatBirthday(draftProfile.birthday)}
                </div>
              </div>
            )}
            {draftProfile.languages && (
              <div className={styles.previewTile}>
                <div className={styles.previewTileLabel}>Languages</div>
                <div className={styles.previewTileValue}>
                  {draftProfile.languages}
                </div>
              </div>
            )}
            {draftProfile.website && (
              <div className={styles.previewTile}>
                <div className={styles.previewTileLabel}>Website</div>
                <div className={styles.previewTileValue}>
                  <a
                    href={draftProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.previewWebsiteLink}
                  >
                    {displayWebsiteUrl(draftProfile.website)}
                    <span className={styles.previewExternalIcon}>↗</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Diving Profile */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Diving Profile</h3>
        {!hasDivingProfile ? (
          <p className={styles.emptyState}>
            This user hasn&apos;t shared their diving preferences yet.
          </p>
        ) : (
          <div className={styles.previewTiles}>
            {draftProfile.yearsDiving !== null &&
              draftProfile.yearsDiving !== undefined && (
                <div className={styles.previewTile}>
                  <div className={styles.previewTileLabel}>Years Diving</div>
                  <div className={styles.previewTileValue}>
                    {draftProfile.yearsDiving}{" "}
                    {draftProfile.yearsDiving === 1 ? "year" : "years"}
                  </div>
                </div>
              )}
            {draftProfile.certifyingAgency && (
              <div className={styles.previewTile}>
                <div className={styles.previewTileLabel}>Certifying Agency</div>
                <div className={styles.previewTileValue}>
                  {draftProfile.certifyingAgency}
                </div>
              </div>
            )}
            {draftProfile.typicalDivingEnvironment &&
              draftProfile.typicalDivingEnvironment.length > 0 && (
                <div className={styles.previewTile}>
                  <div className={styles.previewTileLabel}>
                    Typical Diving Environment
                  </div>
                  <div className={styles.previewTileValue}>
                    {draftProfile.typicalDivingEnvironment.join(", ")}
                  </div>
                </div>
              )}
            {draftProfile.favoriteDiveLocation && (
              <div className={styles.previewTile}>
                <div className={styles.previewTileLabel}>
                  Favorite Dive Location
                </div>
                <div className={styles.previewTileValue}>
                  {draftProfile.favoriteDiveLocation}
                </div>
              </div>
            )}
            {draftProfile.lookingFor && draftProfile.lookingFor.length > 0 && (
              <div className={styles.previewTile}>
                <div className={styles.previewTileLabel}>Looking For</div>
                <div className={styles.previewTileValue}>
                  {draftProfile.lookingFor.join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Certifications */}
      {draftProfile.showCertificationsOnProfile && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Certifications</h3>
          <ProfileCertifications isOwner={true} />
        </div>
      )}

      {/* Section: Gear */}
      {draftProfile.showGearOnProfile && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Gear</h3>
          <ProfileGear />
        </div>
      )}
    </>
  );
}
