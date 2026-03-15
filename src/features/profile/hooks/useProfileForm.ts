"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { GearKitWithItems } from "@/services/database/repositories/gearRepository";
import { parseJsonArray, stringifyJsonArray } from "../utils/parseJsonArray";
import { normalizeDate } from "../utils/profileUtils";
import type {
  ProfileData,
  UserData,
  ProfileFieldValue,
  ViewMode,
  ExperienceLevel,
} from "../types";

const EMPTY_PROFILE: ProfileData = {
  firstName: null,
  lastName: null,
  location: null,
  pronouns: null,
  homeDiveRegion: null,
  website: null,
  languages: null,
  bio: null,
  primaryDiveTypes: null,
  experienceLevel: null,
  yearsDiving: null,
  certifyingAgency: null,
  typicalDivingEnvironment: null,
  lookingFor: null,
  favoriteDiveLocation: null,
  birthday: null,
  avatarUrl: null,
  showCertificationsOnProfile: true,
  showGearOnProfile: true,
};

function normalizeValue(val: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeWebsiteUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function parseProfileData(data: Record<string, unknown>): ProfileData {
  return {
    firstName: (data.firstName as string) || null,
    lastName: (data.lastName as string) || null,
    location: (data.location as string) || null,
    pronouns: (data.pronouns as string) || null,
    homeDiveRegion: (data.homeDiveRegion as string) || null,
    website: (data.website as string) || null,
    languages: (data.languages as string) || null,
    bio: (data.bio as string) || null,
    primaryDiveTypes: parseJsonArray<string>(
      data.primaryDiveTypes as string | null
    ),
    experienceLevel: (data.experienceLevel as ExperienceLevel) || null,
    yearsDiving:
      data.yearsDiving !== null && data.yearsDiving !== undefined
        ? Number(data.yearsDiving)
        : null,
    certifyingAgency: (data.certifyingAgency as string) || null,
    typicalDivingEnvironment: parseJsonArray<string>(
      data.typicalDivingEnvironment as string | null
    ),
    lookingFor: parseJsonArray<string>(data.lookingFor as string | null),
    favoriteDiveLocation: (data.favoriteDiveLocation as string) || null,
    birthday: normalizeDate(
      data.birthday
        ? new Date(data.birthday as string).toISOString().split("T")[0]
        : null
    ),
    avatarUrl: (data.avatarUrl as string) || null,
    showCertificationsOnProfile:
      data.showCertificationsOnProfile !== undefined
        ? Boolean(data.showCertificationsOnProfile)
        : true,
    showGearOnProfile:
      data.showGearOnProfile !== undefined
        ? Boolean(data.showGearOnProfile)
        : true,
  };
}

export function useProfileForm() {
  const { isAuthenticated, user: authUser } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<ViewMode>("view");

  const [draftProfile, setDraftProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(
    null
  );

  // Kit selection state
  const [kits, setKits] = useState<GearKitWithItems[]>([]);
  const [profileKitIds, setProfileKitIds] = useState<string[]>([]);
  const [originalProfileKitIds, setOriginalProfileKitIds] = useState<string[]>(
    []
  );
  const [kitsLoading, setKitsLoading] = useState(false);

  const [editingField, setEditingField] = useState<string | null>(null);
  const inputRefs = useRef<{
    [key: string]: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  }>({});

  const isDirty = useMemo(() => {
    if (!originalProfile) return false;
    const norm = (v: string | string[] | number | null) => {
      if (Array.isArray(v)) return stringifyJsonArray(v);
      if (typeof v === "number") return v;
      return normalizeValue(v);
    };
    return (
      norm(draftProfile.firstName) !== norm(originalProfile.firstName) ||
      norm(draftProfile.lastName) !== norm(originalProfile.lastName) ||
      norm(draftProfile.location) !== norm(originalProfile.location) ||
      norm(draftProfile.pronouns) !== norm(originalProfile.pronouns) ||
      norm(draftProfile.homeDiveRegion) !==
        norm(originalProfile.homeDiveRegion) ||
      norm(draftProfile.website) !== norm(originalProfile.website) ||
      norm(draftProfile.languages) !== norm(originalProfile.languages) ||
      norm(draftProfile.bio) !== norm(originalProfile.bio) ||
      JSON.stringify(draftProfile.primaryDiveTypes || []) !==
        JSON.stringify(originalProfile.primaryDiveTypes || []) ||
      norm(draftProfile.experienceLevel) !==
        norm(originalProfile.experienceLevel) ||
      draftProfile.yearsDiving !== originalProfile.yearsDiving ||
      norm(draftProfile.certifyingAgency) !==
        norm(originalProfile.certifyingAgency) ||
      JSON.stringify(draftProfile.typicalDivingEnvironment || []) !==
        JSON.stringify(originalProfile.typicalDivingEnvironment || []) ||
      JSON.stringify(draftProfile.lookingFor || []) !==
        JSON.stringify(originalProfile.lookingFor || []) ||
      norm(draftProfile.favoriteDiveLocation) !==
        norm(originalProfile.favoriteDiveLocation) ||
      norm(draftProfile.birthday) !== norm(originalProfile.birthday) ||
      draftProfile.showCertificationsOnProfile !==
        originalProfile.showCertificationsOnProfile ||
      draftProfile.showGearOnProfile !== originalProfile.showGearOnProfile ||
      JSON.stringify(profileKitIds.sort()) !==
        JSON.stringify(originalProfileKitIds.sort())
    );
  }, [draftProfile, originalProfile, profileKitIds, originalProfileKitIds]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/profile");
      const data = await response
        .json()
        .catch(() => ({ error: "Failed to parse response" }));
      if (!response.ok) {
        setError(data.error || `Failed to fetch profile (${response.status})`);
        setLoading(false);
        return;
      }
      setUser({
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        email: data.user.email || "",
        avatarUrl: data.user.avatarUrl || null,
      });
      const profileData = parseProfileData(data.user);
      setDraftProfile(profileData);
      setOriginalProfile(profileData);

      // Extract profile kit IDs
      const kitIds = data.user.profileKitIds || [];
      setProfileKitIds(kitIds);
      setOriginalProfileKitIds(kitIds);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchKits = async () => {
    setKitsLoading(true);
    try {
      const response = await fetch("/api/gear-kits");
      if (response.ok) {
        const data = await response.json();
        setKits(data.kits || []);
      }
    } catch (err) {
      console.error("Failed to fetch kits:", err);
    } finally {
      setKitsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchProfile();
    fetchKits();
  }, [isAuthenticated]);

  const handleFieldClick = (field: string) => {
    if (mode === "view") return;
    setEditingField(field);
    setTimeout(() => {
      const input = inputRefs.current[field];
      if (input) {
        input.focus();
        if (input instanceof HTMLInputElement && input.type === "text") {
          input.select();
        }
      }
    }, 0);
  };

  const handleFieldChange = (
    field: keyof ProfileData,
    value: ProfileFieldValue
  ) => {
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleFieldBlur = () => setEditingField(null);

  const handleCancel = () => {
    if (originalProfile) setDraftProfile(originalProfile);
    setProfileKitIds(originalProfileKitIds);
    setEditingField(null);
    setError(null);
    setSuccess(false);
    setMode("view");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const normalizedWebsite = normalizeWebsiteUrl(draftProfile.website);

      const normalizedData: Record<string, ProfileFieldValue> = {
        firstName: normalizeValue(draftProfile.firstName),
        lastName: normalizeValue(draftProfile.lastName),
        location: normalizeValue(draftProfile.location),
        pronouns: normalizeValue(draftProfile.pronouns),
        homeDiveRegion: normalizeValue(draftProfile.homeDiveRegion),
        website: normalizedWebsite,
        languages: normalizeValue(draftProfile.languages),
        bio: normalizeValue(draftProfile.bio),
        primaryDiveTypes: stringifyJsonArray(draftProfile.primaryDiveTypes),
        experienceLevel: normalizeValue(draftProfile.experienceLevel),
        yearsDiving: draftProfile.yearsDiving,
        certifyingAgency: normalizeValue(draftProfile.certifyingAgency),
        typicalDivingEnvironment: stringifyJsonArray(
          draftProfile.typicalDivingEnvironment
        ),
        lookingFor: stringifyJsonArray(draftProfile.lookingFor),
        favoriteDiveLocation: normalizeValue(draftProfile.favoriteDiveLocation),
        birthday: normalizeValue(draftProfile.birthday),
        showCertificationsOnProfile: draftProfile.showCertificationsOnProfile,
        showGearOnProfile: draftProfile.showGearOnProfile,
        profileKitIds: profileKitIds,
      };

      if (
        normalizedData.firstName &&
        typeof normalizedData.firstName === "string" &&
        normalizedData.firstName.length > 50
      ) {
        setError("First name must be 50 characters or less");
        setSaving(false);
        return;
      }
      if (
        normalizedData.lastName &&
        typeof normalizedData.lastName === "string" &&
        normalizedData.lastName.length > 50
      ) {
        setError("Last name must be 50 characters or less");
        setSaving(false);
        return;
      }
      if (
        normalizedData.bio &&
        typeof normalizedData.bio === "string" &&
        normalizedData.bio.length > 500
      ) {
        setError("Bio must be 500 characters or less");
        setSaving(false);
        return;
      }
      if (
        normalizedData.website &&
        typeof normalizedData.website === "string"
      ) {
        try {
          new URL(normalizedData.website);
        } catch {
          setError("Please enter a valid website address");
          setSaving(false);
          return;
        }
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedData),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update profile");

      setUser({
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        email: data.user.email || "",
        avatarUrl: data.user.avatarUrl || null,
      });

      const updatedProfile = parseProfileData(data.user);
      setDraftProfile(updatedProfile);
      setOriginalProfile(updatedProfile);

      // Update profile kit IDs
      const updatedKitIds = data.user.profileKitIds || [];
      setProfileKitIds(updatedKitIds);
      setOriginalProfileKitIds(updatedKitIds);
      setEditingField(null);
      setSuccess(true);
      setMode("view");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdated = async (newUrl: string | null) => {
    setDraftProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
    setUser((prev) => (prev ? { ...prev, avatarUrl: newUrl } : null));
    await fetchProfile();
  };

  return {
    authUser,
    user,
    loading,
    saving,
    error,
    success,
    mode,
    setMode,
    draftProfile,
    isDirty,
    kits,
    profileKitIds,
    setProfileKitIds,
    kitsLoading,
    editingField,
    inputRefs,
    handleFieldClick,
    handleFieldChange,
    handleFieldBlur,
    handleCancel,
    handleSave,
    handleAvatarUpdated,
    fetchProfile,
  };
}
