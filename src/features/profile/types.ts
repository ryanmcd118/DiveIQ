// Profile field types

export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";

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

