// Profile field types

import type { ExperienceLevel } from "@/types";
export type { ExperienceLevel } from "@/types";

export type ProfileFieldValue = string | number | boolean | string[] | null;

export type ViewMode = "view" | "edit";

export interface ProfileData {
  firstName: string | null;
  lastName: string | null;
  location: string | null;
  pronouns: string | null;
  homeDiveRegion: string | null;
  website: string | null;
  languages: string | null;
  bio: string | null;
  primaryDiveTypes: string[] | null;
  experienceLevel: ExperienceLevel | null;
  yearsDiving: number | null;
  certifyingAgency: string | null;
  typicalDivingEnvironment: string[] | null;
  lookingFor: string[] | null;
  favoriteDiveLocation: string | null;
  birthday: string | null;
  avatarUrl: string | null;
  showCertificationsOnProfile: boolean;
  showGearOnProfile: boolean;
}

export interface UserData {
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
}

// Common dive types
export const DIVE_TYPES = [
  "Recreational",
  "Technical",
  "Wreck",
  "Cave",
  "Ice",
  "Cold Water",
  "Tropical",
  "Deep",
  "Night",
  "Drift",
  "Wall",
  "Coral Reef",
] as const;

// Typical diving environments
export const DIVING_ENVIRONMENTS = [
  "Tropical",
  "Temperate",
  "Cold Water",
  "Freshwater",
  "Saltwater",
  "Wreck",
  "Cave",
  "Reef",
  "Wall",
  "Open Water",
] as const;

// Looking for options
export const LOOKING_FOR_OPTIONS = [
  "Buddies",
  "Trips",
  "Instructors",
  "Mentorship",
  "Gear Advice",
  "Dive Sites",
] as const;

// Certifying agencies
export const CERTIFYING_AGENCIES = [
  "PADI",
  "NAUI",
  "SSI",
  "SDI",
  "CMAS",
  "BSAC",
  "GUE",
  "IANTD",
  "TDI",
  "Other",
] as const;
