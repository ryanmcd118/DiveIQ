/**
 * Constants for dive log form options
 */

export const CURRENT_OPTIONS = [
  { value: "", label: "—" },
  { value: "None", label: "None" },
  { value: "Light", label: "Light" },
  { value: "Moderate", label: "Moderate" },
  { value: "Strong", label: "Strong" },
] as const;

export const GAS_TYPE_OPTIONS = [
  { value: "Air", label: "Air" },
  { value: "Nitrox", label: "Nitrox" },
  { value: "Other", label: "Other" },
] as const;

export const EXPOSURE_PROTECTION_OPTIONS = [
  { value: "", label: "—" },
  { value: "Rashguard", label: "Rashguard" },
  { value: "3mm", label: "3mm" },
  { value: "5mm", label: "5mm" },
  { value: "7mm", label: "7mm" },
  { value: "Drysuit", label: "Drysuit" },
  { value: "Other", label: "Other" },
] as const;
