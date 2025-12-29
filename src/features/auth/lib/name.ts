/**
 * Utility functions for handling user names
 */

interface NameComponents {
  firstName: string | null;
  lastName: string | null;
}

interface DisplayNameInput {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
}

/**
 * Splits a full name into firstName and lastName
 * Handles edge cases like compound last names (e.g., "Van Dyke", "De la Cruz")
 */
export function splitFullName(
  fullName: string | null | undefined
): NameComponents {
  if (!fullName) {
    return { firstName: null, lastName: null };
  }

  // Trim and collapse repeated whitespace to single spaces
  const trimmed = fullName.trim().replace(/\s+/g, " ");

  if (trimmed === "") {
    return { firstName: null, lastName: null };
  }

  const tokens = trimmed.split(" ");

  if (tokens.length === 1) {
    // Single token -> firstName only
    return { firstName: tokens[0], lastName: null };
  }

  // Multiple tokens -> first is firstName, rest is lastName (preserves compound names)
  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(" "),
  };
}

/**
 * Gets display name with fallback priority:
 * 1. firstName + optional lastName
 * 2. name field
 * 3. email prefix
 * 4. "User"
 */
export function getDisplayName(input: DisplayNameInput): string {
  const { firstName, lastName, name, email } = input;

  // Priority 1: firstName + optional lastName
  const hasFirstName = firstName && firstName.trim().length > 0;
  const hasLastName = lastName && lastName.trim().length > 0;

  if (hasFirstName && hasLastName) {
    return `${firstName} ${lastName}`;
  }

  if (hasFirstName) {
    return firstName!;
  }

  // Priority 2: name field
  if (name && name.trim().length > 0) {
    return name;
  }

  // Priority 3: email prefix
  if (email && email.trim()) {
    const emailPrefix = email.split("@")[0];
    if (emailPrefix && emailPrefix.trim()) {
      return emailPrefix;
    }
  }

  return "User";
}
