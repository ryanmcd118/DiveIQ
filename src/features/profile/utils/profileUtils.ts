import type { UserData } from "../types";

export function formatUserName(user: UserData | null): string {
  if (!user) return "Profile";
  const hasFirstName = user.firstName && user.firstName.trim().length > 0;
  const hasLastName = user.lastName && user.lastName.trim().length > 0;
  if (hasFirstName && hasLastName) return `${user.firstName} ${user.lastName}`;
  if (hasFirstName) return user.firstName!;
  if (user.email?.trim()) {
    const emailPrefix = user.email.split("@")[0];
    if (emailPrefix?.trim()) return emailPrefix;
  }
  return "Profile";
}

export function normalizeDate(dateString: string | null): string | null {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

export function displayWebsiteUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    if (domain.startsWith("www.")) domain = domain.slice(4);
    return domain;
  } catch {
    let cleaned = url
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    if (cleaned.startsWith("www.")) cleaned = cleaned.slice(4);
    return cleaned.split("/")[0];
  }
}

export function formatBirthday(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}
