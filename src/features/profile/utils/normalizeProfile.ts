export type NormalizedProfileUpdate = {
  data: Record<string, unknown>;
  profileKitIds?: string[];
  validationError?: { error: string; status: number };
};

function normalizeString(val: string | null | undefined): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeWebsiteUrl(url: string | null | undefined): string | null {
  const normalized = normalizeString(url);
  if (!normalized) return null;

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return `https://${normalized}`;
}

export function normalizeProfileUpdate(
  body: Record<string, unknown>
): NormalizedProfileUpdate {
  const {
    firstName,
    lastName,
    birthday,
    location,
    bio,
    pronouns,
    website,
    homeDiveRegion,
    languages,
    primaryDiveTypes,
    experienceLevel,
    yearsDiving,
    certifyingAgency,
    typicalDivingEnvironment,
    lookingFor,
    favoriteDiveLocation,
    showCertificationsOnProfile,
    showGearOnProfile,
    profileKitIds,
  } = body;

  // Validate profileKitIds if provided
  let normalizedProfileKitIds: string[] | undefined = undefined;
  if (profileKitIds !== undefined) {
    if (!Array.isArray(profileKitIds)) {
      return {
        data: {},
        validationError: {
          error: "profileKitIds must be an array",
          status: 400,
        },
      };
    }
    normalizedProfileKitIds = profileKitIds
      .filter((id): id is string => typeof id === "string" && id.trim() !== "")
      .map((id) => id.trim());
  }

  // Normalize string values
  const normalizedFirstName = normalizeString(
    firstName as string | null | undefined
  );
  const normalizedLastName = normalizeString(
    lastName as string | null | undefined
  );
  const normalizedBio = normalizeString(bio as string | null | undefined);
  const normalizedWebsite = normalizeWebsiteUrl(
    website as string | null | undefined
  );
  const normalizedLocation = normalizeString(
    location as string | null | undefined
  );
  const normalizedPronouns = normalizeString(
    pronouns as string | null | undefined
  );
  const normalizedHomeDiveRegion = normalizeString(
    homeDiveRegion as string | null | undefined
  );
  const normalizedLanguages = normalizeString(
    languages as string | null | undefined
  );
  const normalizedPrimaryDiveTypes = normalizeString(
    primaryDiveTypes as string | null | undefined
  );
  const normalizedExperienceLevel = normalizeString(
    experienceLevel as string | null | undefined
  );
  const normalizedCertifyingAgency = normalizeString(
    certifyingAgency as string | null | undefined
  );
  const normalizedTypicalDivingEnvironment = normalizeString(
    typicalDivingEnvironment as string | null | undefined
  );
  const normalizedLookingFor = normalizeString(
    lookingFor as string | null | undefined
  );
  const normalizedFavoriteDiveLocation = normalizeString(
    favoriteDiveLocation as string | null | undefined
  );

  // Validate JSON array fields
  const jsonArrayFields = {
    primaryDiveTypes: normalizedPrimaryDiveTypes,
    typicalDivingEnvironment: normalizedTypicalDivingEnvironment,
    lookingFor: normalizedLookingFor,
  };
  for (const [field, value] of Object.entries(jsonArrayFields)) {
    if (value !== null) {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          return {
            data: {},
            validationError: {
              error: `${field} must be a JSON array`,
              status: 400,
            },
          };
        }
      } catch {
        return {
          data: {},
          validationError: {
            error: `${field} must be a valid JSON array`,
            status: 400,
          },
        };
      }
    }
  }

  // Validate firstName/lastName max length
  if (normalizedFirstName && normalizedFirstName.length > 50) {
    return {
      data: {},
      validationError: {
        error: "First name must be 50 characters or less",
        status: 400,
      },
    };
  }
  if (normalizedLastName && normalizedLastName.length > 50) {
    return {
      data: {},
      validationError: {
        error: "Last name must be 50 characters or less",
        status: 400,
      },
    };
  }

  // Validate bio max length
  if (normalizedBio && normalizedBio.length > 500) {
    return {
      data: {},
      validationError: {
        error: "Bio must be 500 characters or less",
        status: 400,
      },
    };
  }

  // Validate website URL format
  if (normalizedWebsite) {
    try {
      new URL(normalizedWebsite);
    } catch {
      return {
        data: {},
        validationError: {
          error: "Please enter a valid website address",
          status: 400,
        },
      };
    }
  }

  // Parse birthday
  let birthdayDate: Date | null = null;
  if (birthday !== undefined) {
    if (birthday !== null && birthday !== "") {
      const dateParts = (birthday as string).split("-");
      if (dateParts.length !== 3) {
        return {
          data: {},
          validationError: {
            error: "Invalid birthday date format",
            status: 400,
          },
        };
      }

      birthdayDate = new Date(
        Date.UTC(
          parseInt(dateParts[0], 10),
          parseInt(dateParts[1], 10) - 1,
          parseInt(dateParts[2], 10),
          12,
          0,
          0,
          0
        )
      );

      if (isNaN(birthdayDate.getTime())) {
        return {
          data: {},
          validationError: {
            error: "Invalid birthday date format",
            status: 400,
          },
        };
      }
    } else {
      birthdayDate = null;
    }
  }

  // Normalize yearsDiving
  let normalizedYearsDiving: number | null = null;
  if (yearsDiving !== undefined && yearsDiving !== null && yearsDiving !== "") {
    const parsed =
      typeof yearsDiving === "number"
        ? yearsDiving
        : parseInt(String(yearsDiving), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      normalizedYearsDiving = parsed;
    }
  }

  // Build data object with only provided fields
  const data: Record<string, unknown> = {
    ...(firstName !== undefined && { firstName: normalizedFirstName }),
    ...(lastName !== undefined && { lastName: normalizedLastName }),
    ...(birthday !== undefined && { birthday: birthdayDate }),
    ...(location !== undefined && { location: normalizedLocation }),
    ...(bio !== undefined && { bio: normalizedBio }),
    ...(pronouns !== undefined && { pronouns: normalizedPronouns }),
    ...(website !== undefined && { website: normalizedWebsite }),
    ...(homeDiveRegion !== undefined && {
      homeDiveRegion: normalizedHomeDiveRegion,
    }),
    ...(languages !== undefined && { languages: normalizedLanguages }),
    ...(primaryDiveTypes !== undefined && {
      primaryDiveTypes: normalizedPrimaryDiveTypes,
    }),
    ...(experienceLevel !== undefined && {
      experienceLevel: normalizedExperienceLevel,
    }),
    ...(yearsDiving !== undefined && {
      yearsDiving: normalizedYearsDiving,
    }),
    ...(certifyingAgency !== undefined && {
      certifyingAgency: normalizedCertifyingAgency,
    }),
    ...(typicalDivingEnvironment !== undefined && {
      typicalDivingEnvironment: normalizedTypicalDivingEnvironment,
    }),
    ...(lookingFor !== undefined && { lookingFor: normalizedLookingFor }),
    ...(favoriteDiveLocation !== undefined && {
      favoriteDiveLocation: normalizedFavoriteDiveLocation,
    }),
    ...(showCertificationsOnProfile !== undefined && {
      showCertificationsOnProfile: Boolean(showCertificationsOnProfile),
    }),
    ...(showGearOnProfile !== undefined && {
      showGearOnProfile: Boolean(showGearOnProfile),
    }),
  };

  return {
    data,
    profileKitIds: normalizedProfileKitIds,
  };
}
