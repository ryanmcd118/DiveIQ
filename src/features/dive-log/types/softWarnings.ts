/**
 * Structured soft-required validation warnings
 */
export type SoftWarningField = "maxDepth" | "bottomTime";

export interface SoftWarning {
  fieldKey: SoftWarningField;
  label: string;
  message: string;
}

export const SOFT_WARNING_DEFS: Record<
  SoftWarningField,
  { label: string; message: string }
> = {
  maxDepth: { label: "Max depth", message: "Max depth is recommended." },
  bottomTime: { label: "Bottom time", message: "Bottom time is recommended." },
};

export function toSoftWarnings(fieldKeys: SoftWarningField[]): SoftWarning[] {
  return fieldKeys.map((key) => ({
    fieldKey: key,
    label: SOFT_WARNING_DEFS[key].label,
    message: SOFT_WARNING_DEFS[key].message,
  }));
}
